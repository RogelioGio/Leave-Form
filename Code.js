
function doGet() {
  return (
    HtmlService.createHtmlOutputFromFile("index")
      .setTitle("Leave Form")
      // CHANGED: DEFAULT prevents external sites from breaking your UI layout
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
  );
}

// --- CONFIGURATION ---
const MAIN_SHEET_NAME = "LRA_Leave_Applications"; 
const PDF_TEMPLATE_SHEET = "LeaveApplicationFormTemplate";
const PDF_FOLDER_ID = "1L_EG3hJXfGwAHI7QbBihCN1aWegD1E7e"; // Keep your folder ID
const LOGGING = true;

function saveForm(values) {
  const lock = LockService.getScriptLock();
  
  if (lock.tryLock(10000)) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(MAIN_SHEET_NAME); 

      if (!sheet) {
        return { status: "error", message: `Sheet '${MAIN_SHEET_NAME}' not found` };
      }

      // 1. NAME PARSING
      let lastName = "", firstName = "", middleName = "";
      if (values.fullName) {
        const str = values.fullName.toString();
        if (str.includes(",")) {
          const parts = str.split(",").map(p => p.trim());
          lastName = parts[0] || "";
          firstName = parts[1] || "";
          middleName = parts[2] || "";
        } else {
          const parts = str.split(" ");
          lastName = parts.pop() || "";
          firstName = parts.join(" ");
        }
      }

      // 2. INTELLIGENT DATE HANDLING
      let dateObjects = [];
      const timeZone = Session.getScriptTimeZone();

      if (values.dateTypes === "single" && values.singleDate) {
        dateObjects.push(new Date(values.singleDate));
      } 
      else if (values.dateTypes === "range" && values.startDate && values.endDate) {
        let current = new Date(values.startDate);
        let end = new Date(values.endDate);
        while (current <= end) {
          dateObjects.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      } 
      else if (values.dates && values.dates.length > 0) {
        dateObjects = values.dates.map(d => new Date(d));
      }

      // Normalize dates (midnight) and sort
      dateObjects = dateObjects.map(d => {
        d.setHours(0, 0, 0, 0);
        return d;
      }).sort((a, b) => a - b);

      if (dateObjects.length === 0) {
        return { status: "error", message: "No dates selected" };
      }

      // 3. GENERATE SMART STRINGS
      let dateRanges = [];
      let startGroup = dateObjects[0];
      let endGroup = dateObjects[0];

      for (let i = 1; i <= dateObjects.length; i++) {
        const current = dateObjects[i];
        const nextExpected = new Date(endGroup.getTime());
        nextExpected.setDate(endGroup.getDate() + 1);

        if (current && current.toDateString() === nextExpected.toDateString()) {
          endGroup = current;
        } else {
          const sameMonth = startGroup.getMonth() === endGroup.getMonth();
          if (startGroup.getTime() === endGroup.getTime()) {
            dateRanges.push(Utilities.formatDate(startGroup, timeZone, "MMM d"));
          } else if (sameMonth) {
            dateRanges.push(`${Utilities.formatDate(startGroup, timeZone, "MMM d")}-${Utilities.formatDate(endGroup, timeZone, "d")}`);
          } else {
            dateRanges.push(`${Utilities.formatDate(startGroup, timeZone, "MMM d")} - ${Utilities.formatDate(endGroup, timeZone, "MMM d")}`);
          }
          startGroup = current;
          endGroup = current;
        }
      }
      const finalOffice = (values.office === "Others" || !values.office) 
                    ? (values.otherOfficesAndPostion || "Not Specified") 
                    : values.office;
                    
      const smartDateString = dateRanges.join("; ");
      const rawIsoList = dateObjects.map(d => Utilities.formatDate(d, timeZone, "yyyy-MM-dd")).join(", ");
      const durationStr = dateObjects.length + (dateObjects.length === 1 ? " Working day" : " Working days");
      var lastRow = sheet.getLastRow() + 1;
      // 4. MAP TO COLUMNS (Matches your 21-column structure)
      const rowData = [
        new Date(),                                
        values.email,                            
        finalOffice,                           
        lastName,                                
        firstName,                               
        middleName,                              
        values.position,                         
        values.salaryGrade,                      
        values.typeOfLeave,                      
        values.vacationSpecialPrivilegeLeaveSpecifications || "", 
        values.abroadSpecification || "",                        
        values.sickLeaveSpecification || "",                     
        values.inHospitalSpecification || "",                    
        values.outpatientSpecification || "",                    
        values.specialLeaveBenefitsForWomenSpecification || "", 
        values.studyLeaveSpecification || "", // FIXED: Matches your payload key
        values.otherSpecification || "",                         
        values.otherPurposeSpecification || "",                  
        rawIsoList,         // Column S
        smartDateString,    // Column T
        durationStr         // Column U
      ];

      sheet.appendRow(rowData);
      const actualRow = sheet.getLastRow();
      SpreadsheetApp.flush();

      // Pass the Row Number to your PDF Processor
      ProcessingApplicationToPDF(actualRow); 

      return { status: "success", message: "Form submitted successfully" };

    } catch (e) {
      return { status: "error", message: e.toString() };
    } finally {
      lock.releaseLock();
    }
  } else {
    return { status: "error", message: "Server is busy. Please try again." };
  }
}

function ProcessingApplicationToPDF(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const LeaveApplicationForm = ss.getSheetByName(PDF_TEMPLATE_SHEET);
  const Applications = ss.getSheetByName(MAIN_SHEET_NAME);

  if (!LeaveApplicationForm || !Applications) {
    console.log("Not enough data to process");
    return;
  }

  // Smart Data Loader
  let formData = {};
  if (e && e.namedValues) {
    formData = e.namedValues;
  } else {
    formData = buildNamedValuesFromLastRow(Applications);
  }

  const normMap = buildNormalizedMap(formData);

  // Helper to safely get values
  function getVal(keys) {
    keys = Array.isArray(keys) ? keys : [keys];
    for (let k of keys) {
      const nk = normalizeKey(k);
      if (normMap.hasOwnProperty(nk)) {
        let v = normMap[nk];
        if (Array.isArray(v)) v = v[0];
        return v === undefined || v === null ? "" : v;
      }
    }
    return "";
  }

  // --- MAPPING LOGIC ---
  const lastName = getVal(["Last Name", "LAST NAME"]);
  const firstName = getVal(["First Name", "FIRST NAME"]);
  const middleName = getVal(["Middle Name", "MIDDLE NAME"]);
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(" "); 

  // Basic Info
  LeaveApplicationForm.getRange("B5").setValue(getVal(["Office/Department", "Office / Department"]));
  LeaveApplicationForm.getRange("E5").setValue(fullName);
  
  // Date of Filing
  LeaveApplicationForm.getRange("D6").setValue(convertDateOfFilingFormat(getVal(["Timestamp", "Date"])));
  LeaveApplicationForm.getRange("F6").setValue(getVal(["Position"]));
  
  // Salary Grade
  let sg = getVal(["Salary Grade"]);
  if(sg && !sg.toString().toLowerCase().startsWith("sg")) {
    sg = "SG" + sg;
  }
  LeaveApplicationForm.getRange("K6").setValue(sg);

  // --- CHECKBOX LOGIC ---
  const checkboxs = [
    getVal(["Type of Leave to be Avail of"]),
    getVal(["Vacation/Special Privilege Leave Specification"]),
    getVal(["Specify if the employee is an In Hospital or Outpatient"]),
    getVal(["Specify the reason of study leave within the option given"]),
    getVal(["What the purpose of the employee on availing the leave"]),
    getVal(["Specify the country if you selected \"Abroad\" from the previous question"]), 
    getVal(["Specify which type of leave where the employee want to avail"]),
    getVal(["Please specify the nature of the illness requiring the employee's inpatient hospitalization"]),
    getVal(["Please specify the medical condition for which the employee is receiving outpatient treatment.  "]) 
  ];
  
  checkboxFillUp(LeaveApplicationForm, checkboxs);

  // --- DATES (FIXED FOR MULTI-DATE GROUPING) ---
  
  // 1. Get the Smart Formatted String (e.g., "February 28, 2026; April 1-3, 2026")
  // 2. Get the Duration (e.g., "4 Working days")
  const smartDateRange = getVal(["Inclusive Dates", "Smart Date String"]); 
  const durationStr = getVal(["Duration", "Total Duration"]);

  // 3. Set values in the Template
  if (smartDateRange) {
      // We no longer add "to" because the string is already formatted correctly
      LeaveApplicationForm.getRange("C48").setValue(smartDateRange);
  }
  
  if (durationStr) {
      LeaveApplicationForm.getRange("C45").setValue(durationStr); 
  }

  // Footer
  LeaveApplicationForm.getRange("I48").setValue(fullName);

  // Email
  const email = getVal(["Email Address", "Email"]);
  exportCSForm6PDF(LeaveApplicationForm, (lastName || "NoLastName"), email);
}

function getDate(duration, smartDateString) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("LeaveApplicationFormTemplate");
  
  if (!sheet) {
    Logger.log("Sheet not found");
    return;
  }

  // Set the duration (e.g., "4 Working days")
  sheet.getRange("C45").setValue(duration);

  // Set the smart range (e.g., "February 28, 2026; April 1-3, 2026")
  sheet.getRange("C48").setValue(smartDateString);
  
  Logger.log("Duration updated: " + duration);
  Logger.log("Dates updated: " + smartDateString);
}


function checkboxFillUp(sheet, inputList){
    const others = "B41";

    const leaveType = {
      vacationleavesec51rulexviomnibusrulesimplementingeono292: "B11", mandatory: "B13", sick: "B15",
      maternity: "B17", paternity: "B19", privilege : "B21",
      solo: "B23", study: "B25", vawc: "B27", 
      rehabilitation: "B29", specialleavebenefitsforwomen: "B31",
      specialemergency: "B33", adoption: "B35"

    };

    const specifyLeave = {
      withinthephilippines: "H13", abroad: "H15",
      inhospital: "H19", outpatient: "H21",
      completionofmasters: "H33", completionofmastersdegree: "H33",
      bar: "H35",
      monetization: "H39", monetizationofleavecredits: "H39",
      terminalleave: "H41", terminal: "H41"
    };

    const textMapping = {
      "H15":"J15",
      "H19":"J19",
      "H21":"J21",
      "B31": "J27"
    }

    const allCells = [...Object.values(leaveType), ...Object.values(specifyLeave)];
    const textCells = [...Object.values(textMapping)];
    
    [...new Set([...allCells, ...textCells, others])].forEach(cell => sheet.getRange(cell).clearContent());
    allCells.forEach(cell => sheet.getRange(cell).setValue(false));

    // 3. PROCESSING
    const norm = (s) => (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const tokens = (s) => (s || "").toString().toLowerCase().match(/[a-z0-9]+/g) || [];
    
    
    
    let activeTextCell = others
    const unknownParts = [];

    inputList.filter(Boolean).forEach((rawInput, index) => {
      const parts = rawInput.toString().split(/;[,\/|&\n\r]/);
      Logger.log(`--- Processing Input #${index}: "${rawInput}" ---`);

      parts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed || trimmed.length < 3) return;

        const nPart = norm(trimmed);
        const tPart = new Set(tokens(trimmed));
        Logger.log(nPart + "normalan")
        Logger.log(tPart + "token")
        let matched = false;

        // Check against Main and Specify Maps
        [leaveType, specifyLeave].forEach(map => {
          for (let key in map) {
            const keyTokens = tokens(key);
            if (nPart === key || (keyTokens.length > 0 && keyTokens.every(t => tPart.has(t)))) {
              const checkboxCell = map[key];
              sheet.getRange(checkboxCell).setValue(true);
              matched = true;
              
              // If this checkbox has a specific text box, prioritize it
              if (textMapping[checkboxCell]) {
                activeTextCell = textMapping[checkboxCell];
              }
            }
          }
        });

        // 4. COLLECT LEFTOVERS (The "Specify" text)
        const isCitation = /^(sec|section|rule|ra|r\.a\.|s\.|no\.|omnibus|e\.?o\.?)/i.test(trimmed);
        if (!matched && !isCitation) {
          unknownParts.push(trimmed);
        }
      });
    });

    // 5. WRITE THE TEXT
  // 5. WRITE THE TEXT ONLY
    if (unknownParts.length > 0) {
      const filteredParts = unknownParts.filter(part => {
        const cleanPart = part.trim().toLowerCase();
        // Ignore the words "others" or "other" themselves
        return !["others", "other"].includes(cleanPart);
      });
      if (filteredParts.length > 0) {
        // Write the text (e.g., "Bar exam") to the blank space
        sheet.getRange(activeTextCell).setValue(filteredParts.join("; "));
        sheet.getRange(activeTextCell).setWrap(true);
        
        // NOTE: We are NOT calling .setValue(true) on the checkbox cell here
      }
    }
}

function buildNamedValuesFromForm(ss) {
  try {
    
    const formUrl = ss.getFormUrl();
    if (!formUrl) return {};
    const form = FormApp.openByUrl(formUrl);
    const responses = form.getResponses();
    if (!responses || responses.length === 0) return {};
    const latest = responses[responses.length - 1];
    const nv = {};
    nv["Timestamp"] = [latest.getTimestamp()];
    latest.getItemResponses().forEach(ir => {
      const title = ir.getItem().getTitle();
      const resp = ir.getResponse();
      nv[title] = Array.isArray(resp) ? [resp.join(", ")] : [resp];
    });
    return nv;
  } catch (err) {
    Logger.log("buildNamedValuesFromForm error: " + err);
    return {};
  }
}

function buildNamedValuesFromLastRow(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return {};
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const row = sheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];
    const nv = {};
    headers.forEach((h, i) => nv[h] = [row[i]]);
    return nv;
  } catch (err) {
    Logger.log("buildNamedValuesFromLastRow error: " + err);
    return {};
  }
}

function normalizeKey(k) {
  return k.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildNormalizedMap(formData) {
  const norm = {};
  for (let fk in formData) {
    if (!fk) continue;
    norm[normalizeKey(fk)] = formData[fk];
  }
  return norm;
}

function convertDateOfFilingFormat(dateValue) {
  if (LOGGING) Logger.log("convertDateOfFilingFormat called with: " + JSON.stringify(dateValue));
  
  if (!dateValue || dateValue === "") {
    if (LOGGING) Logger.log("Date value is empty, returning empty string");
    return "";
  }
  
  try {
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      var d = dateValue;
      var result = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
      if (LOGGING) Logger.log("Formatted Date object as: " + result);
      return result;
    }
    
  

    var str = dateValue.toString().trim();
    if (LOGGING) Logger.log("String value: '" + str + "'");
    
    str = str.split(" ")[0];
    if (LOGGING) Logger.log("After removing time: '" + str + "'");
    
    var parts = [];
    if (str.indexOf("/") > -1) {
      parts = str.split("/");
    } else if (str.indexOf("-") > -1) {
      parts = str.split("-");
    } else if (str.indexOf(".") > -1) {
      parts = str.split(".");
    }
    
    if (LOGGING) Logger.log("Split parts: " + JSON.stringify(parts));
    
    if (parts.length < 3) {
      if (LOGGING) Logger.log("Not enough parts, returning original: " + dateValue.toString());
      return dateValue.toString();
    }
    
    var month, day, year;
    
    // Determine format: YYYY-MM-DD or MM/DD/YYYY
    if (parseInt(parts[0]) > 31) {
      // YYYY-MM-DD format
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
      if (LOGGING) Logger.log("Detected ISO format - year: " + year + ", month: " + month + ", day: " + day);
    } else {
      // MM/DD/YYYY format
      month = parseInt(parts[0]);
      day = parseInt(parts[1]);
      year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      if (LOGGING) Logger.log("Detected MM/DD/YYYY format - month: " + month + ", day: " + day + ", year: " + year);
    }
    
    //
    if (month < 1 || month > 12) {
      if (LOGGING) Logger.log("Invalid month: " + month);
      return dateValue.toString();
    }
    
    var result = months[month - 1] + " " + day + ", " + year;
    if (LOGGING) Logger.log("Final formatted result: '" + result + "'");
    return result;
  } catch (e) {
    if (LOGGING) Logger.log("Exception in convertDateOfFilingFormat: " + e);
    return dateValue.toString();
  }
}

function exportCSForm6PDF(sheet, baseName, email) {
  try {
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const safeName = (baseName || "NoLastName").toString().replace(/[\\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
    const filename = safeName + "_CS_FORM_NO_6_" + timestamp + ".pdf";

    const temp = SpreadsheetApp.create("temp_export_" + timestamp);
    const copied = sheet.copyTo(temp);
    copied.setName("Export");
    temp.getSheets().forEach(s => { if (s.getSheetId() !== copied.getSheetId()) temp.deleteSheet(s); });

    const dataRange = copied.getDataRange();
    const lastCol = dataRange.getLastColumn();
    try {
      //copied.setPrintArea(copied.getRange("A1:R60"));
      copied.getRange(1, 1, dataRange.getNumRows(), Math.max(1, dataRange.getNumColumns())).setFontSize(11);
      // copied.autoResizeColumns(1, Math.min(lastCol, 15));
    } catch (e) {
      if (LOGGING) Logger.log("Non-fatal layout tweak failed: " + e);
    }

    const gid = copied.getSheetId();
    const url = "https://docs.google.com/spreadsheets/d/" + temp.getId() +
      "/export?format=pdf" +
      "&size=A4" +             
      "&portrait=true" +       
      "&scale=2" +             // Change scale to 2 (Width)
      "&fitw=true" +           // Specifically set Fit to Width to true
      "&top_margin=0.25" +
      "&bottom_margin=0.25" +
      "&left_margin=0.25" +
      "&right_margin=0.25" +
      "&sheetnames=false" +
      "&printtitle=false" +
      "&pagenumbers=false" +
      "&gridlines=false" +
      "&fzr=false" +           
      "&gid=" + gid;
    const token = ScriptApp.getOAuthToken();
    const response = fetchWithRetry(url, { headers: { Authorization: "Bearer " + token } });
    const blob = response.getBlob().setName(filename);
    
    // PDF to Google Drive
    DriveApp.getFolderById(PDF_FOLDER_ID).createFile(blob);
    if (LOGGING) Logger.log("✓ PDF saved to Drive: " + filename);
    
    // Email with PDF attachment
    const emailStr = email ? email.toString().trim() : "";
    if (LOGGING) Logger.log("Email to send to: '" + emailStr + "'");
    
    if (emailStr && emailStr.length > 0 && emailStr.indexOf("@") !== -1) {
      try {
        GmailApp.sendEmail(
          emailStr,
          "CS Form No. 6 - " + baseName,
          "Dear Employee,\n\n" +
          "Please be informed that your CS Form No. 6 (Application for Leave) has been successfully generated. " +
          "A copy of the completed form, based on your submitted responses, is attached for your reference.\n\n" +
          "For any questions or clarifications, please contact the Human Resources Department during office hours.\n\n" +
          "Thank you.\n\n" +
          "Respectfully,\n" +
          "Human Resources Department",
          { attachments: [blob] }
        );
        if (LOGGING) Logger.log("✓ PDF emailed successfully to: " + emailStr);
      } catch (emailErr) {
        Logger.log("✗ Error sending email to " + emailStr + ": " + emailErr);
      }
    } else {
      Logger.log("⚠ No valid email provided or invalid format. Email value: '" + emailStr + "'");
    }

    DriveApp.getFileById(temp.getId()).setTrashed(true);
    if (LOGGING) Logger.log("Temporary spreadsheet cleaned up.");
  } catch (err) {
    Logger.log("Error generating PDF: " + err);
  }
}
function fetchWithRetry(url, opts, maxAttempts = 4) {
  let attempt = 0;
  while (++attempt <= maxAttempts) {
    try {
      const res = UrlFetchApp.fetch(url, opts);
      const code = res.getResponseCode ? res.getResponseCode() : 200;
      if (code >= 200 && code < 300) return res;
      throw new Error("HTTP " + code);
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      Utilities.sleep(500 * Math.pow(2, attempt));
    }
  }
} 

