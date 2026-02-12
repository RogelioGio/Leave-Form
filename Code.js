function doGet() {
  return (
    HtmlService.createHtmlOutputFromFile("index")
      .setTitle("Leave Form")
      // CHANGED: DEFAULT prevents external sites from breaking your UI layout
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
  );
}

function saveForm(values) {
  const lock = LockService.getScriptLock();
  // Wait for up to 10 seconds for other processes to finish.
  if (lock.tryLock(10000)) {
    try {
      // 1. OPEN THE SHEET
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      // CHANGE THIS to match your exact sheet name if it is not "Form Responses 1"
      const sheet = ss.getSheetByName("Form Responses 1");

      if (!sheet) {
        return {
          status: "error",
          message: "Sheet 'Form Responses 1' not found",
        };
      }

      const rowData = [
        new Date(),
        values.fullName,
        values.email,
        values.officeDepartment,
        values.position,
        values.salaryGrade,
        values.typeOfLeave,
        values.vacationSpecialPrivilegeLocation || "",
        values.abroadSpecification || "",
        values.sickLeaveSpecification || "",
        values.inHospitalSpecification || "",
        values.outpatientSpecification || "",
        values.specialLeaveBenefitsForWomenSpecification || "",
        values.studyLeaveSpecification || "",
        values.otherSpecification || "",
        values.otherPurposeSpecification || "",
        values.startDate,
        values.endDate,
      ];

      sheet.appendRow(rowData);

      return { status: "success", message: "Form submitted successfully" };
    } catch (e) {
      return { status: "error", message: e.toString() };
    } finally {
      lock.releaseLock();
    }
  } else {
    return { status: "error", message: "Server is busy, please try again." };
  }
}

const PDF_FOLDER_ID = "1L_EG3hJXfGwAHI7QbBihCN1aWegD1E7e";
const LOGGING = true;

function onFormSubmit(e) {
  const lock = LockService.getScriptLock();
  let gotLock = false;
  try {
    gotLock = lock.tryLock(10000);
    if (!gotLock) {
      Logger.log("Could not obtain script lock; aborting to avoid race.");
      return;
    }
    fetchLatestFormResponse(e);
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err);
  } finally {
    if (gotLock) lock.releaseLock();
  }
}

function fetchLatestFormResponse(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const templateSheet = ss.getSheetByName("CS_FORM_NO_6");
  const responsesSheet = ss.getSheetByName("Form Responses 1");
  if (!templateSheet || !responsesSheet) {
    Logger.log("Required sheet(s) not found!");
    return;
  }

  let formData = buildNamedValuesFromForm(ss);
  if (Object.keys(formData).length === 0 && e && e.namedValues)
    formData = e.namedValues;
  if (Object.keys(formData).length === 0)
    formData = buildNamedValuesFromLastRow(responsesSheet);

  const normMap = buildNormalizedMap(formData);
  if (LOGGING) {
    Logger.log("Available response keys: " + Object.keys(formData).join(", "));
    Logger.log("Normalized response keys: " + Object.keys(normMap).join(", "));
  }

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
    const fallbackVariants = [
      "officedept",
      "officedepartment",
      "office",
      "department",
    ];
    for (let v of fallbackVariants) {
      if (normMap.hasOwnProperty(v)) {
        let val = normMap[v];
        if (Array.isArray(val)) val = val[0];
        return val === undefined || val === null ? "" : val;
      }
    }
    return "";
  }

  const lastName = getVal(["LAST NAME", "Last Name", "lastname"]);
  templateSheet
    .getRange("C5")
    .setValue(
      getVal([
        "Office / Department",
        "Office/Department",
        "Office - Department",
        "Office",
      ]),
    );
  templateSheet.getRange("G5").setValue(lastName);
  templateSheet
    .getRange("J5")
    .setValue(getVal(["FIRST NAME", "First Name", "firstname"]));
  templateSheet
    .getRange("Q5")
    .setValue(getVal(["MIDDLE NAME", "Middle Name", "middlename"]));
  templateSheet.getRange("H6").setValue(getVal(["Position", "Job Position"]));
  templateSheet.getRange("Q6").setValue(getVal(["Salary", "Monthly Salary"]));
  const dateOfFilingValue = convertDateOfFilingFormat(
    getVal(["Date of Filing", "Date", "Timestamp"]),
  );
  templateSheet.getRange("F6").setNumberFormat("@").setValue(dateOfFilingValue);

  const leaveRaw = getVal([
    "TYPE OF LEAVE TO BE AVAILED OF",
    "Type of Leave",
    "Leave Type",
  ]);
  let leaveOtherText = "";
  for (let k of [
    "Other (please specify)",
    "If other, please specify",
    "Other",
  ]) {
    const nk = normalizeKey(k);
    if (normMap.hasOwnProperty(nk)) {
      let v = normMap[nk];
      if (Array.isArray(v)) v = v[0];
      leaveOtherText = v === undefined || v === null ? "" : v;
      break;
    }
  }

  const vacationLocationRaw = getVal([
    "In case of Vacation/Special Privilege Leave",
    "Vacation/Special Privilege Leave",
    "Vacation Location",
  ]);
  const abroadReasonRaw = getVal([
    'Specify if you selected "Abroad" on previous question',
    "Reason for Abroad",
    "Abroad Reason",
  ]);

  const sickLeaveTypeRaw = getVal([
    "In case of Sick Leave",
    "Sick Leave Type",
    "Sick Leave",
  ]);
  const illnessReasonRaw = getVal([
    "Specify the Illness",
    "Illness",
    "Illness Reason",
  ]);

  const womenBenefitsIllnessRaw = getVal([
    "In case of Special Leave Benefits for Women: (Specify Illness)",
    "Special Leave Benefits for Women Illness",
    "Women Benefits Illness",
  ]);

  const studyLeaveTypeRaw = getVal([
    "In case of Study Leave",
    "Study Leave Type",
    "Study Leave",
  ]);

  const otherPurposeRaw = getVal([
    "Other purpose",
    "Other Purpose",
    "Other Purpose Type",
  ]);

  const workingDaysRaw = getVal([
    "NUMBER OF WORKING DAYS APPLIED FOR",
    "Number of Working Days Applied For",
    "Working Days",
  ]);

  const inclusiveDatesRaw = getVal([
    "INCLUSIVE DATES",
    "Inclusive Dates",
    "Dates",
  ]);

  applyLeaveCheckboxes(templateSheet, leaveRaw, leaveOtherText);
  applyVacationLocationCheckboxes(
    templateSheet,
    vacationLocationRaw,
    abroadReasonRaw,
  );
  applySickLeaveCheckboxes(templateSheet, sickLeaveTypeRaw, illnessReasonRaw);
  applySpecialBenefitsForWomenCheckboxes(
    templateSheet,
    womenBenefitsIllnessRaw,
  );
  applyStudyLeaveCheckboxes(templateSheet, studyLeaveTypeRaw);
  applyOtherPurposeCheckboxes(templateSheet, otherPurposeRaw);

  if (workingDaysRaw && workingDaysRaw.toString().trim()) {
    templateSheet.getRange("E45").setValue(workingDaysRaw.toString().trim());
    if (LOGGING)
      Logger.log("Set E45 with working days: '" + workingDaysRaw + "'");
  }

  if (inclusiveDatesRaw && inclusiveDatesRaw.toString().trim()) {
    templateSheet.getRange("E48").setValue(inclusiveDatesRaw.toString().trim());
    if (LOGGING)
      Logger.log("Set E48 with inclusive dates: '" + inclusiveDatesRaw + "'");
  }

  // First Name, Middle Name, Last Name - N48
  const firstName = templateSheet.getRange("J5").getValue();
  const middleName = templateSheet.getRange("Q5").getValue();
  const lastNameValue = templateSheet.getRange("G5").getValue();
  const fullName = [firstName, middleName, lastNameValue]
    .filter((v) => v && v.toString().trim())
    .join(" ");
  templateSheet.getRange("N48").setValue(fullName);
  if (LOGGING) Logger.log("Set N48 with full name: '" + fullName + "'");

  // Extract email from column 19 (Email Address column) - use existing responsesSheet
  const lastRow = responsesSheet.getLastRow();
  let email = "";
  if (lastRow > 1) {
    const emailValue = responsesSheet.getRange(lastRow, 19).getValue();
    email = emailValue ? emailValue.toString().trim() : "";
  }
  if (LOGGING) Logger.log("Extracted email from column 19: '" + email + "'");

  exportCSForm6PDF(templateSheet, lastName || "NoLastName", email);
}

function convertDateOfFilingFormat(dateValue) {
  if (LOGGING)
    Logger.log(
      "convertDateOfFilingFormat called with: " + JSON.stringify(dateValue),
    );

  if (!dateValue || dateValue === "") {
    if (LOGGING) Logger.log("Date value is empty, returning empty string");
    return "";
  }

  try {
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // If it's already a Date object
    if (dateValue instanceof Date) {
      var d = dateValue;
      var result =
        months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
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
      if (LOGGING)
        Logger.log(
          "Not enough parts, returning original: " + dateValue.toString(),
        );
      return dateValue.toString();
    }

    var month, day, year;

    // Determine format: YYYY-MM-DD or MM/DD/YYYY
    if (parseInt(parts[0]) > 31) {
      // YYYY-MM-DD format
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
      if (LOGGING)
        Logger.log(
          "Detected ISO format - year: " +
            year +
            ", month: " +
            month +
            ", day: " +
            day,
        );
    } else {
      // MM/DD/YYYY format
      month = parseInt(parts[0]);
      day = parseInt(parts[1]);
      year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      if (LOGGING)
        Logger.log(
          "Detected MM/DD/YYYY format - month: " +
            month +
            ", day: " +
            day +
            ", year: " +
            year,
        );
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
    latest.getItemResponses().forEach((ir) => {
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
    headers.forEach((h, i) => (nv[h] = [row[i]]));
    return nv;
  } catch (err) {
    Logger.log("buildNamedValuesFromLastRow error: " + err);
    return {};
  }
}

function normalizeKey(k) {
  return k
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildNormalizedMap(formData) {
  const norm = {};
  for (let fk in formData) {
    if (!fk) continue;
    norm[normalizeKey(fk)] = formData[fk];
  }
  return norm;
}

function applyVacationLocationCheckboxes(
  sheet,
  vacationLocation,
  abroadReason,
) {
  try {
    if (LOGGING)
      Logger.log(
        "applyVacationLocationCheckboxes input: " +
          vacationLocation +
          " | abroadReason: " +
          abroadReason,
      );

    function setCheckboxValue(cellAddr, checked) {
      const r = sheet.getRange(cellAddr);
      const dv = r.getDataValidation();
      if (
        dv &&
        dv.getCriteriaType &&
        dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX
      ) {
        const cvals = dv.getCriteriaValues() || [];
        const checkedVal =
          cvals.length > 0 && cvals[0] !== undefined && cvals[0] !== null
            ? cvals[0]
            : true;
        const uncheckedVal =
          cvals.length > 1 && cvals[1] !== undefined && cvals[1] !== null
            ? cvals[1]
            : false;
        r.setValue(checked ? checkedVal : uncheckedVal);
        if (LOGGING)
          Logger.log(
            `Set ${cellAddr} -> ${checked ? checkedVal : uncheckedVal} (checkbox custom)`,
          );
      } else {
        r.setValue(!!checked);
        if (LOGGING) Logger.log(`Set ${cellAddr} -> ${!!checked}`);
      }
    }

    setCheckboxValue("J13", false);
    setCheckboxValue("J15", false);
    sheet.getRange("Q15").setValue("");

    if (!vacationLocation) {
      if (LOGGING)
        Logger.log(
          "No vacation location provided; clearing J13, J15, and Q15.",
        );
      return;
    }

    const normalized = vacationLocation
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      normalized.indexOf("withinphilippines") !== -1 ||
      normalized.indexOf("within") !== -1
    ) {
      setCheckboxValue("J13", true);
      if (LOGGING) Logger.log("Set J13 checkbox for 'Within the Philippines'");
    } else if (normalized.indexOf("abroad") !== -1) {
      setCheckboxValue("J15", true);
      if (LOGGING) Logger.log("Set J15 checkbox for 'Abroad'");

      if (abroadReason && abroadReason.toString().trim()) {
        sheet.getRange("Q15").setValue(abroadReason.toString().trim());
        if (LOGGING)
          Logger.log("Set Q15 with abroad reason: '" + abroadReason + "'");
      }
    }
  } catch (err) {
    Logger.log("applyVacationLocationCheckboxes error: " + err);
  }
}

function applySickLeaveCheckboxes(sheet, sickLeaveType, illnessReason) {
  try {
    if (LOGGING)
      Logger.log(
        "applySickLeaveCheckboxes input: " +
          sickLeaveType +
          " | illnessReason: " +
          illnessReason,
      );

    function setCheckboxValue(cellAddr, checked) {
      const r = sheet.getRange(cellAddr);
      const dv = r.getDataValidation();
      if (
        dv &&
        dv.getCriteriaType &&
        dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX
      ) {
        const cvals = dv.getCriteriaValues() || [];
        const checkedVal =
          cvals.length > 0 && cvals[0] !== undefined && cvals[0] !== null
            ? cvals[0]
            : true;
        const uncheckedVal =
          cvals.length > 1 && cvals[1] !== undefined && cvals[1] !== null
            ? cvals[1]
            : false;
        r.setValue(checked ? checkedVal : uncheckedVal);
        if (LOGGING)
          Logger.log(
            `Set ${cellAddr} -> ${checked ? checkedVal : uncheckedVal} (checkbox custom)`,
          );
      } else {
        r.setValue(!!checked);
        if (LOGGING) Logger.log(`Set ${cellAddr} -> ${!!checked}`);
      }
    }

    setCheckboxValue("J19", false);
    setCheckboxValue("J21", false);
    sheet.getRange("J23:Q23").setValue("");

    if (!sickLeaveType) {
      if (LOGGING)
        Logger.log(
          "No sick leave type provided; clearing J19, J21, and J23:Q23.",
        );
      return;
    }

    const normalized = sickLeaveType
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      normalized.indexOf("inhospital") !== -1 ||
      normalized.indexOf("hospital") !== -1
    ) {
      setCheckboxValue("J19", true);
      if (LOGGING) Logger.log("Set J19 checkbox for 'In Hospital'");

      if (illnessReason && illnessReason.toString().trim()) {
        sheet.getRange("J23").setValue(illnessReason.toString().trim());
        if (LOGGING)
          Logger.log("Set J23 with illness reason: '" + illnessReason + "'");
      }
    } else if (normalized.indexOf("outpatient") !== -1) {
      setCheckboxValue("J21", true);
      if (LOGGING) Logger.log("Set J21 checkbox for 'Out Patient'");

      if (illnessReason && illnessReason.toString().trim()) {
        sheet.getRange("J23").setValue(illnessReason.toString().trim());
        if (LOGGING)
          Logger.log("Set J23 with illness reason: '" + illnessReason + "'");
      }
    }
  } catch (err) {
    Logger.log("applySickLeaveCheckboxes error: " + err);
  }
}

function applySpecialBenefitsForWomenCheckboxes(sheet, womenBenefitsIllness) {
  try {
    if (LOGGING)
      Logger.log(
        "applySpecialBenefitsForWomenCheckboxes input: " + womenBenefitsIllness,
      );

    sheet.getRange("J29").setValue("");

    if (!womenBenefitsIllness) {
      if (LOGGING)
        Logger.log("No women benefits illness provided; clearing J29.");
      return;
    }

    if (womenBenefitsIllness && womenBenefitsIllness.toString().trim()) {
      sheet.getRange("J29").setValue(womenBenefitsIllness.toString().trim());
      if (LOGGING)
        Logger.log(
          "Set J29 with women benefits illness reason: '" +
            womenBenefitsIllness +
            "'",
        );
    }
  } catch (err) {
    Logger.log("applySpecialBenefitsForWomenCheckboxes error: " + err);
  }
}

function applyStudyLeaveCheckboxes(sheet, studyLeaveType) {
  try {
    if (LOGGING)
      Logger.log("applyStudyLeaveCheckboxes input: " + studyLeaveType);

    function setCheckboxValue(cellAddr, checked) {
      const r = sheet.getRange(cellAddr);
      const dv = r.getDataValidation();
      if (
        dv &&
        dv.getCriteriaType &&
        dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX
      ) {
        const cvals = dv.getCriteriaValues() || [];
        const checkedVal =
          cvals.length > 0 && cvals[0] !== undefined && cvals[0] !== null
            ? cvals[0]
            : true;
        const uncheckedVal =
          cvals.length > 1 && cvals[1] !== undefined && cvals[1] !== null
            ? cvals[1]
            : false;
        r.setValue(checked ? checkedVal : uncheckedVal);
        if (LOGGING)
          Logger.log(
            `Set ${cellAddr} -> ${checked ? checkedVal : uncheckedVal} (checkbox custom)`,
          );
      } else {
        r.setValue(!!checked);
        if (LOGGING) Logger.log(`Set ${cellAddr} -> ${!!checked}`);
      }
    }

    setCheckboxValue("J33", false);
    setCheckboxValue("J35", false);

    if (!studyLeaveType) {
      if (LOGGING)
        Logger.log("No study leave type provided; clearing J33 and J35.");
      return;
    }

    const normalized = studyLeaveType
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      normalized.indexOf("completionofmasters") !== -1 ||
      normalized.indexOf("mastersdegree") !== -1
    ) {
      setCheckboxValue("J33", true);
      if (LOGGING)
        Logger.log("Set J33 checkbox for 'Completion of Master's Degree'");
    } else if (
      normalized.indexOf("bar") !== -1 ||
      normalized.indexOf("boardexamination") !== -1
    ) {
      setCheckboxValue("J35", true);
      if (LOGGING)
        Logger.log("Set J35 checkbox for 'BAR/Board Examination Review'");
    }
  } catch (err) {
    Logger.log("applyStudyLeaveCheckboxes error: " + err);
  }
}

function applyOtherPurposeCheckboxes(sheet, otherPurpose) {
  try {
    if (LOGGING)
      Logger.log("applyOtherPurposeCheckboxes input: " + otherPurpose);

    function setCheckboxValue(cellAddr, checked) {
      const r = sheet.getRange(cellAddr);
      const dv = r.getDataValidation();
      if (
        dv &&
        dv.getCriteriaType &&
        dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX
      ) {
        const cvals = dv.getCriteriaValues() || [];
        const checkedVal =
          cvals.length > 0 && cvals[0] !== undefined && cvals[0] !== null
            ? cvals[0]
            : true;
        const uncheckedVal =
          cvals.length > 1 && cvals[1] !== undefined && cvals[1] !== null
            ? cvals[1]
            : false;
        r.setValue(checked ? checkedVal : uncheckedVal);
        if (LOGGING)
          Logger.log(
            `Set ${cellAddr} -> ${checked ? checkedVal : uncheckedVal} (checkbox custom)`,
          );
      } else {
        r.setValue(!!checked);
        if (LOGGING) Logger.log(`Set ${cellAddr} -> ${!!checked}`);
      }
    }

    setCheckboxValue("J39", false);
    setCheckboxValue("J41", false);

    if (!otherPurpose) {
      if (LOGGING)
        Logger.log("No other purpose provided; clearing J39 and J41.");
      return;
    }

    const normalized = otherPurpose
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      normalized.indexOf("monetization") !== -1 ||
      normalized.indexOf("leavecredits") !== -1
    ) {
      setCheckboxValue("J39", true);
      if (LOGGING)
        Logger.log("Set J39 checkbox for 'Monetization of Leave Credits'");
    } else if (normalized.indexOf("terminal") !== -1) {
      setCheckboxValue("J41", true);
      if (LOGGING) Logger.log("Set J41 checkbox for 'Terminal Leave'");
    }
  } catch (err) {
    Logger.log("applyOtherPurposeCheckboxes error: " + err);
  }
}

function applyLeaveCheckboxes(sheet, leaveRaw, otherText) {
  try {
    const reasonRange = "E41:F41";

    const leaveToCell = {
      vacation: "D11",
      vacationleave: "D11",
      mandatory: "D13",
      forced: "D13",
      mandatoryforced: "D13",
      sick: "D15",
      sickleave: "D15",
      maternity: "D17",
      paternity: "D19",
      specialprivilege: "D21",
      specialprivilegeleave: "D21",
      soloparent: "D23",
      soloparentleave: "D23",
      study: "D25",
      studyleave: "D25",
      vawc: "D27",
      tendayvawc: "D27",
      rehabilitation: "D29",
      specialbenefitsforwomen: "D31",
      specialleavebenefitsforwomen: "D31",
      specialemergency: "D33",
      calamity: "D33",
      adoption: "D35",
      adoptionleave: "D35",
    };

    const subOptionToCell = {
      withinphilippines: "J13",
      abroad: "J15",
      inhospital: "J19",
      outpatient: "J21",
      completionofmasters: "J33",
      completionofmastersdegree: "J33",
      bar: "J35",
      barreview: "J35",
      boardexamination: "J35",
      monetization: "J39",
      monetizationofleavecredits: "J39",
      terminalleave: "J41",
      terminal: "J41",
    };

    function setCheckboxValue(cellAddr, checked) {
      const r = sheet.getRange(cellAddr);
      const dv = r.getDataValidation();
      if (
        dv &&
        dv.getCriteriaType &&
        dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX
      ) {
        const cvals = dv.getCriteriaValues() || [];
        const checkedVal =
          cvals.length > 0 && cvals[0] !== undefined && cvals[0] !== null
            ? cvals[0]
            : true;
        const uncheckedVal =
          cvals.length > 1 && cvals[1] !== undefined && cvals[1] !== null
            ? cvals[1]
            : false;
        r.setValue(checked ? checkedVal : uncheckedVal);
        if (LOGGING)
          Logger.log(
            `Set ${cellAddr} -> ${checked ? checkedVal : uncheckedVal} (checkbox custom)`,
          );
      } else {
        r.setValue(!!checked);
        if (LOGGING) Logger.log(`Set ${cellAddr} -> ${!!checked}`);
      }
    }

    function splitTopLevel(s) {
      const res = [];
      let cur = "",
        depth = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "(") {
          depth++;
          cur += ch;
          continue;
        }
        if (ch === ")") {
          if (depth > 0) depth--;
          cur += ch;
          continue;
        }
        if (
          depth === 0 &&
          (ch === "," ||
            ch === ";" ||
            ch === "/" ||
            ch === "|" ||
            ch === "&" ||
            ch === "\n" ||
            ch === "\r")
        ) {
          if (cur.trim()) res.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      if (cur.trim()) res.push(cur.trim());
      const final = [];
      res.forEach((part) => {
        const normalized = part.replace(/\s+/g, " ");
        const tokens = normalized.split(/\s+and\s+/i);
        tokens.forEach((t) => {
          if (t && t.trim()) final.push(t.trim());
        });
      });
      return final;
    }

    function isCitationOrNoise(s) {
      if (!s || !s.trim()) return true;
      const v = s.trim();
      if (v.length < 3) return true;
      if (
        /^(sec|section|rule|ra|r\.a\.|s\.|no\.|omnibus|implementing|e\.?o\.?|\(|\))/i.test(
          v,
        )
      )
        return true;
      if (/^(rule\s*\d+|sec\.?\s*\d+)/i.test(v)) return true;
      if (/^[\d\.\-\/\s]+$/.test(v)) return true;
      return false;
    }

    const allCells = Array.from(
      new Set([
        ...Object.values(leaveToCell),
        ...Object.values(subOptionToCell),
      ]),
    );
    allCells.forEach((cell) => setCheckboxValue(cell, false));
    sheet.getRange(reasonRange).setValue("");

    if (!leaveRaw) {
      if (LOGGING)
        Logger.log("No leave type provided; all leave checkboxes cleared.");
      if (otherText && otherText.toString().trim()) {
        sheet.getRange(reasonRange).setValue(otherText.toString().trim());
        if (LOGGING)
          Logger.log(
            "Wrote Other (separate field) to " +
              reasonRange +
              ": '" +
              otherText +
              "'",
          );
      }
      return;
    }

    if (LOGGING)
      Logger.log(
        "applyLeaveCheckboxes input: " +
          leaveRaw +
          " | otherText: " +
          otherText,
      );

    const rawParts = splitTopLevel(leaveRaw.toString());
    if (rawParts.length === 0) rawParts.push(leaveRaw.toString());
    if (LOGGING)
      Logger.log("Split parts (top-level): " + JSON.stringify(rawParts));

    function norm(s) {
      return (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    }
    function tokens(s) {
      return (
        (s || "")
          .toString()
          .toLowerCase()
          .match(/[a-z0-9]+/g) || []
      );
    }

    const keyTokenSets = {};
    for (let k in leaveToCell) keyTokenSets[k] = new Set(tokens(k));
    const subKeyTokenSets = {};
    for (let k in subOptionToCell) subKeyTokenSets[k] = new Set(tokens(k));

    const unknownParts = [];
    let otherSelectedNoDetail = false;

    rawParts.forEach((part) => {
      const trimmed = (part || "").toString().trim();
      const otherMatch = trimmed.match(
        /^\s*others?\s*(?:\(\s*please\s*specify\s*\))?\s*[:\-–—]?\s*(.*)$/i,
      );
      if (otherMatch) {
        let captured = (otherMatch[1] || "").trim();
        if (!captured && otherText && otherText.toString().trim())
          captured = otherText.toString().trim();
        if (captured) {
          unknownParts.push(captured);
          if (LOGGING) Logger.log("Captured Other reason: '" + captured + "'");
        } else {
          otherSelectedNoDetail = true;
          if (LOGGING)
            Logger.log(
              "Other selected but no detail supplied for part: '" +
                trimmed +
                "'",
            );
        }
      }

      const nPart = norm(part);
      const tPart = new Set(tokens(part));
      if (LOGGING)
        Logger.log(
          `Part='${part}' norm='${nPart}' tokens=${JSON.stringify(Array.from(tPart))}`,
        );

      let matched = false;
      if (nPart && leaveToCell[nPart]) {
        setCheckboxValue(leaveToCell[nPart], true);
        matched = true;
      }
      if (!matched) {
        for (let key in leaveToCell) {
          const keySet = keyTokenSets[key];
          const keyInPart = [...keySet].every((tok) => tPart.has(tok));
          const partInKey = [...tPart].every((tok) => keySet.has(tok));
          if (keyInPart || partInKey) {
            setCheckboxValue(leaveToCell[key], true);
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        for (let key in leaveToCell) {
          if (
            nPart &&
            (nPart.indexOf(key) !== -1 || key.indexOf(nPart) !== -1)
          ) {
            setCheckboxValue(leaveToCell[key], true);
            matched = true;
            break;
          }
        }
      }

      let subMatched = false;
      if (!subMatched && nPart && subOptionToCell[nPart]) {
        setCheckboxValue(subOptionToCell[nPart], true);
        subMatched = true;
      }
      if (!subMatched) {
        for (let key in subOptionToCell) {
          const keySet = subKeyTokenSets[key];
          const keyInPart = [...keySet].every((tok) => tPart.has(tok));
          const partInKey = [...tPart].every((tok) => keySet.has(tok));
          if (keyInPart || partInKey) {
            setCheckboxValue(subOptionToCell[key], true);
            subMatched = true;
            break;
          }
        }
      }
      if (!subMatched) {
        for (let key in subOptionToCell) {
          if (
            nPart &&
            (nPart.indexOf(key) !== -1 || key.indexOf(nPart) !== -1)
          ) {
            setCheckboxValue(subOptionToCell[key], true);
            subMatched = true;
            break;
          }
        }
      }

      if (!matched && !subMatched && trimmed) {
        if (!isCitationOrNoise(trimmed)) {
          unknownParts.push(trimmed);
          if (LOGGING)
            Logger.log("Treating unmatched part as reason: '" + trimmed + "'");
        } else if (LOGGING) {
          Logger.log("Ignored citation/noise fragment: '" + trimmed + "'");
        }
      }
    });

    if (otherText && otherText.toString().trim()) {
      const t = otherText.toString().trim();
      if (!unknownParts.includes(t)) unknownParts.push(t);
    }

    if (unknownParts.length > 0) {
      const reasonText = unknownParts.join("; ");
      sheet.getRange(reasonRange).setValue(reasonText);
      if (LOGGING)
        Logger.log(
          "Wrote reason(s) to " + reasonRange + ": '" + reasonText + "'",
        );
    } else {
      sheet.getRange(reasonRange).setValue("");
      if (otherSelectedNoDetail && LOGGING)
        Logger.log(
          "Other selected but no details supplied; left " +
            reasonRange +
            " blank",
        );
    }
  } catch (err) {
    Logger.log("applyLeaveCheckboxes error: " + err);
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

function exportCSForm6PDF(sheet, baseName, email) {
  try {
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd_HHmmss",
    );
    const safeName = (baseName || "NoLastName")
      .toString()
      .replace(/[\\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_");
    const filename = safeName + "_CS_FORM_NO_6_" + timestamp + ".pdf";

    const temp = SpreadsheetApp.create("temp_export_" + timestamp);
    const copied = sheet.copyTo(temp);
    copied.setName("Export");
    temp.getSheets().forEach((s) => {
      if (s.getSheetId() !== copied.getSheetId()) temp.deleteSheet(s);
    });

    const dataRange = copied.getDataRange();
    const lastCol = dataRange.getLastColumn();
    try {
      copied.setPrintArea(copied.getRange("A1:R60"));
      copied
        .getRange(
          1,
          1,
          dataRange.getNumRows(),
          Math.max(1, dataRange.getNumColumns()),
        )
        .setFontSize(11);
      // copied.autoResizeColumns(1, Math.min(lastCol, 15));
    } catch (e) {
      if (LOGGING) Logger.log("Non-fatal layout tweak failed: " + e);
    }

    const gid = copied.getSheetId();
    const url =
      "https://docs.google.com/spreadsheets/d/" +
      temp.getId() +
      "/export?format=pdf" +
      "&size=A4" + // A4 is standard for government forms
      "&portrait=true" + // Keep vertical
      "&scale=4" + // 4 = Fit to Page (Essential!)
      "&top_margin=0.25" +
      "&bottom_margin=0.25" +
      "&left_margin=0.25" +
      "&right_margin=0.25" +
      "&sheetnames=false" +
      "&printtitle=false" +
      "&pagenumbers=false" +
      "&gridlines=false" +
      "&fzr=false" + // Don't repeat frozen rows
      "&gid=" +
      gid;
    const token = ScriptApp.getOAuthToken();
    const response = fetchWithRetry(url, {
      headers: { Authorization: "Bearer " + token },
    });
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
            "Please be informed that your CS Form No. 6 (Application for Leave) has been successfully processed. " +
            "A copy of the completed form, based on your submitted responses, is attached for your reference.\n\n" +
            "For any questions or clarifications, please contact the Human Resources Department during office hours.\n\n" +
            "Thank you.\n\n" +
            "Respectfully,\n" +
            "Human Resources Department",
          { attachments: [blob] },
        );
        if (LOGGING) Logger.log("✓ PDF emailed successfully to: " + emailStr);
      } catch (emailErr) {
        Logger.log("✗ Error sending email to " + emailStr + ": " + emailErr);
      }
    } else {
      Logger.log(
        "⚠ No valid email provided or invalid format. Email value: '" +
          emailStr +
          "'",
      );
    }

    DriveApp.getFileById(temp.getId()).setTrashed(true);
    if (LOGGING) Logger.log("Temporary spreadsheet cleaned up.");
  } catch (err) {
    Logger.log("Error generating PDF: " + err);
  }
}

function testApplyLeaveCheckboxes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    ss.getSheetByName("CS_FORM_NO_6") || ss.insertSheet("CS_FORM_NO_6");
  const addresses = [
    "D11",
    "D13",
    "D15",
    "D17",
    "D19",
    "D21",
    "D23",
    "D25",
    "D27",
    "D29",
    "D31",
    "D33",
    "D35",
    "J13",
    "J15",
    "J19",
    "J21",
    "J33",
    "J35",
    "J39",
    "J41",
    "E41",
    "F41",
  ];
  [
    "D11",
    "D13",
    "D15",
    "D17",
    "D19",
    "D21",
    "D23",
    "D25",
    "D27",
    "D29",
    "D31",
    "D33",
    "D35",
    "J13",
    "J15",
    "J19",
    "J21",
    "J33",
    "J35",
    "J39",
    "J41",
  ].forEach((a) => {
    sheet
      .getRange(a)
      .setDataValidation(
        SpreadsheetApp.newDataValidation().requireCheckbox().build(),
      );
  });

  const tests = [
    {
      input:
        "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
      other: "",
    },
    { input: "Vacation Leave; Within the Philippines", other: "" },
    { input: "Sick Leave; In Hospital (Pneumonia)", other: "" },
    { input: "Study Leave; Completion of Master's Degree", other: "" },
    { input: "Other: Compassionate leave due to emergency", other: "" },
    { input: "Other:", other: "" },
    { input: "Compassionate leave (no 'Other' word)", other: "" },
  ];

  tests.forEach((t) => {
    applyLeaveCheckboxes(sheet, t.input, t.other);
    const out = {};
    addresses.forEach((a) => (out[a] = sheet.getRange(a).getValue()));
    Logger.log("Input: '" + t.input + "' => " + JSON.stringify(out));
    applyLeaveCheckboxes(sheet, "", "");
  });
}
