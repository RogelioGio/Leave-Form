import { useFormik } from "formik";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar1,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { toast } from "sonner";
import Completed from "./Completed";
import { format, isSameDay, parseISO } from "date-fns";
import Holidays from "date-holidays";

export default function Leave_Form({ setSubmitted }) {
  const [hd, setHd] = useState(null);

  useEffect(() => {
    const getHolidays = async () => {
      const currentYear = new Date().getFullYear();
      const res = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/PH`,
      );

      if (res.ok) {
        const data = await res.json();
        console.log("Fetched holidays:", data);
        setHd(data);
      }
    };

    getHolidays();
  }, []);

  const officeOptions = [
    "Office of the Administrator",
    "Office of the Deputy Administrator",
    "Information and Communications Technology Division",
    "LRA-Comprehensive Agrarian Reform Program (CARP)",
    "Planning and Management Division",
    "Office of the Director, Administrative Service",
    "Human Resource Development Division",
    "Recruitment Management Unit",
    "General Services Division",
    "Property and Supply Section",
    "Central Records Section",
    "Cashiering Services Section",
    "Public Relations and Information Section / Public Assistance Complaint Desk",
    "Office of the Director, Finance Service",
    "Budget Division",
    "Budget Section",
    "Statistical Section",
    "Accounting Division",
    "Revenue Section",
    "Disbursement Section",
    "Office of the Director, Land Registration Operations Service",
    "Original Registration Division",
    "Land Projection Section",
    "Plan Examination Section",
    "Records and Verification Section",
    "Subdivision and Consolidation Division - Vault One (I) and Vault Two (II) Section",
    "Cadastral Decree Section",
    "Ordinary Decree Section",
    "Subdivision and Consolidation Division",
    "Plotting and Examination Section",
    "Docket Division",
    "Publication of Notices Section",
    "Documentation and Index Section",
    "Docket Vault Section",
    "Office of the Director, Legal Service",
    "Legal Division",
    "Land Registration Monitoring Division",
    "Land Registration Cases Division",
    "Reconstitution Division",
    "Others",
  ];

  const typeOfLeaveOptions = [
    "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "Maternity Leave (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)",
    "Paternity Leave (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)",
    "Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "Solo Parent Leave (RA No. 8972 / CSC MC No. 8, s. 2004)",
    "Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "10-Day VAWC Leave (RA No. 9262 / CSC MC No. 15, s. 2005)",
    "Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
    "Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)",
    "Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)",
    "Adoption Leave (R.A. No. 8552)",
    "Others",
  ];

  const allowedDomain = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "company.com",
  ];

  const [stage, setStage] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = async (formik) => {
    const errors = await formik.validateForm();

    const stepFields = [
      ["email", "fullName", "office", "position", "salaryGrade"],
      [
        "typeOfLeave",
        "vacationSpecialPrivilegeLeaveSpecifications",
        "abroadSpecification",
        "sickLeaveSpecification",
        "inHospitalSpecification",
        "outpatientSpecification",
        "specialLeaveBenefitsForWomenSpecification",
        "studyLeaveReason",
        "otherSpecification",
        "otherPurposeSpecification",
      ],
      ["dates"],
    ];

    const currentFields = stepFields[stage];

    const hasErrors = currentFields.some((field) => errors[field]);
    if (!hasErrors) {
      formik.setTouched({});
      setStage((prev) => prev + 1);
    } else {
      const touchedFields = {};
      currentFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formik.setTouched(touchedFields);
    }
  };

  const validationSchema = [
    // STAGE 0
    Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Requester Email is required")
        .test(
          "is-company-domain",
          "only valid email domains are allowed",
          (value) => {
            if (!value) return false;
            const domain = value.substring(value.lastIndexOf("@") + 1);
            return allowedDomain.includes(domain.toLowerCase());
          },
        ),
      fullName: Yup.string()
        .trim()
        .required("Requestor Name is required")
        .max(50, "Requestor Name must be at most 50 characters")
        .min(5, "Requestor Name must be at least 5 characters")
        .matches(
          /^[a-zA-Z\s.,]+$/,
          "Requestor Name can only contain letters, spaces, and commas",
        ),
      office: Yup.string()
        .required("Office/Department is required")
        .max(100, "Office/Department must be at most 100 characters"),
      otherOfficesAndPostion: Yup.string()
        .required()
        .when("office", {
          is: "Others",
          then: () =>
            Yup.string()
              .required("Please specify your office/department")
              .max(100, "Office/Department must be at most 100 characters"),
          otherwise: () => Yup.string().notRequired(),
        }),
      position: Yup.string()
        .required("Position is required")
        .max(50, "Position must be at most 50 characters")
        .min(2, "Position must be at least 2 characters")
        .matches(
          /^[a-zA-Z\s.,]+$/,
          "Position can only contain letters, spaces, and commas",
        ),
      salaryGrade: Yup.string()
        .required("Salary Grade is required")
        .max(4, "Salary Grade must be at most 4 characters")

        .matches(
          /^SG\d+$/,
          'Salary Grade must start with "SG" followed by numbers',
        )
        .test("range", "Salary Grade must be between SG1 and SG33", (value) => {
          if (!value) return true;

          const numberPart = parseInt(value.replace("SG", ""), 10);
          return numberPart >= 1 && numberPart <= 33;
        }),
    }),
    // STAGE 1
    Yup.object({
      typeOfLeave: Yup.string().required("Required to select type of leave"),
      vacationSpecialPrivilegeLeaveSpecifications: Yup.string().when(
        "typeOfLeave",
        {
          is: (value) =>
            value ===
              "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ||
            value ===
              "Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
          then: () =>
            Yup.string().required(
              "Required to specify if the leave is within the Philippines or abroad",
            ),
          otherwise: () => Yup.string().notRequired(),
        },
      ),
      abroadSpecification: Yup.string().when(
        "vacationSpecialPrivilegeLeaveSpecifications",
        {
          is: "Abroad",
          then: (schema) =>
            schema
              .required("Required to specify the country to be visited")
              .trim() // Removes accidental spaces at start/end
              .min(2, "Country name must be at least 2 characters")
              .max(60, "Country name is too long")
              // ALLOWS: Letters, Spaces, Dots (.), Hyphens (-), Apostrophes (')
              .matches(
                /^[a-zA-Z\s\-\.\']+$/,
                "Country name cannot contain numbers or special symbols (@, #, !, etc.)",
              ),
          otherwise: (schema) => schema.notRequired(),
        },
      ),
      sickLeaveSpecification: Yup.string().when("typeOfLeave", {
        is: "Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
        then: (schema) =>
          schema.required(
            "Required to specify if the employee is an In Hospital or Outpatient",
          ),
        otherwise: (schema) => schema.notRequired(),
      }),

      inHospitalSpecification: Yup.string().when("sickLeaveSpecification", {
        is: "In Hospital",
        then: (schema) =>
          schema
            .required("Required to specify the details for In Hospital")
            .matches(
              /^[a-zA-Z\s\-\.\'\,]+$/,
              "Illness name cannot contain numbers or special symbols (@, #, !, etc.)",
            ),
        otherwise: (schema) => schema.notRequired(),
      }),

      outpatientSpecification: Yup.string().when("sickLeaveSpecification", {
        is: "Outpatient",
        then: (schema) =>
          schema
            .required("Required to specify the details for Outpatient")
            .matches(
              /^[a-zA-Z\s\-\.\'\,]+$/,
              "Illness name cannot contain numbers or special symbols (@, #, !, etc.)",
            ),
        otherwise: (schema) => schema.notRequired(),
      }),
      specialLeaveBenefitsForWomenSpecification: Yup.string().when(
        "typeOfLeave",
        {
          is: "Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)",
          then: () =>
            Yup.string()
              .required(
                "Required to specify the details for Special Leave Benefits for Women",
              )
              .matches(
                /^[a-zA-Z\s\-\.\'\,]+$/,
                "Details cannot contain numbers or special symbols (@, #, !, etc.)",
              ),
          otherwise: () => Yup.string().notRequired(),
        },
      ),
      studyLeaveReason: Yup.string().when("typeOfLeave", {
        is: "Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
        then: () =>
          Yup.string().required(
            "Required to specify the reason of study leave",
          ),
        otherwise: () => Yup.string().notRequired(),
      }),
      otherSpecification: Yup.string().when("typeOfLeave", {
        is: "Others",
        then: () =>
          Yup.string()
            .required(
              "Required to specify which type of leave the employee wants to avail",
            )
            .matches(
              /^[a-zA-Z\s\-\.\'\,]+$/,
              "Details cannot contain numbers or special symbols (@, #, !, etc.)",
            ),
        otherwise: () => Yup.string().notRequired(),
      }),
    }),

    // STAGE 2 Validation Correction
    Yup.object({
      dateTypes: Yup.string().required("Required to select duration of leave"),
      // Only require singleDate if mode is 'single'
      singleDate: Yup.date().when("dateTypes", {
        is: "single",
        then: (schema) => schema.required("Please select a date"),
        otherwise: (schema) => schema.notRequired(),
      }),
      // Only require range dates if mode is 'range'
      startDate: Yup.date().when("dateTypes", {
        is: "range",
        then: (schema) => schema.required("Start date is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      endDate: Yup.date().when("dateTypes", {
        is: "range",
        then: (schema) => schema.required("End date is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      // Multiple dates check
      dates: Yup.array().when("dateTypes", {
        is: "multiple",
        then: (schema) => schema.min(1, "Select at least one date"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
  ];

  const formik = useFormik({
    initialValues: {
      email: "",
      fullName: "",
      office: "",
      position: "",
      salaryGrade: "SG",
      otherOfficesAndPostion: "",
      typeOfLeave: "",
      //  Vacation/Special Privilege Leave
      vacationSpecialPrivilegeLeaveSpecifications: "",
      abroadSpecification: "",
      // Sick Leave
      sickLeaveSpecification: "",
      inHospitalSpecification: "",
      outpatientSpecification: "",
      // Special Leave Benefits for Women
      specialLeaveBenefitsForWomenSpecification: "",
      // Study Leave
      studyLeaveSpecification: "",
      // Other
      otherSpecification: "",
      otherPurposeSpecification: "",
      // Duration of Leave
      dateTypes: "single", // default to single date selection eg: single range and stagger
      singleDate: null,
      startDate: null,
      endDate: null,
      dates: [], // stagger dates from now on
    },
    validationSchema: validationSchema[stage],
    onSubmit: async (values) => {
      // 1. Calculate the list of dates based on selection type
      let dateList = [];

      if (values.dateTypes === "single" && values.singleDate) {
        dateList = [values.singleDate];
      } else if (
        values.dateTypes === "range" &&
        values.startDate &&
        values.endDate
      ) {
        let current = new Date(values.startDate);
        const end = new Date(values.endDate);
        while (current <= end) {
          dateList.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      } else if (values.dates && values.dates.length > 0) {
        dateList = values.dates;
      }

      // 2. Create a clean list of string dates for the backend
      const formattedDates = dateList
        .sort((a, b) => new Date(a) - new Date(b))
        .map((date) => format(new Date(date), "yyyy-MM-dd"));

      // 3. Prepare the payload (CONVERT ALL DATES TO STRINGS HERE)
      // This prevents the "Illegal value" error
      const submissionData = {
        ...values,
        singleDate: values.singleDate
          ? format(new Date(values.singleDate), "yyyy-MM-dd")
          : null,
        startDate: values.startDate
          ? format(new Date(values.startDate), "yyyy-MM-dd")
          : null,
        endDate: values.endDate
          ? format(new Date(values.endDate), "yyyy-MM-dd")
          : null,
        dates: formattedDates,
        totalDays: formattedDates.length,
      };

      // 4. Send to Google Apps Script
      if (window.google && window.google.script) {
        const TIMEOUT_DURATION = 15000; // 15 seconds safeguard

        const googleScriptPromise = new Promise((resolve, reject) => {
          // --> ADDED: Timeout timer
          const timeoutId = setTimeout(() => {
            reject("Request timed out. The server took too long to respond.");
          }, TIMEOUT_DURATION);

          window.google.script.run
            .withSuccessHandler((response) => {
              clearTimeout(timeoutId);
              if (response && response.status === "success") {
                resolve(response);
              } else {
                reject(response.message || "Unknown error from server");
              }
            })
            .withFailureHandler((error) => {
              clearTimeout(timeoutId);
              reject(error.message || error);
            })
            .saveForm(submissionData);
        });

        try {
          setSubmitting(true);
          setLoading(true);
          await toast.promise(googleScriptPromise, {
            loading: "Submitting request...",
            success: () => {
              setSubmitting(false);
              setSubmitted(true);
              return "Request submitted successfully!";
            },
            error: (err) => {
              setSubmitting(false);
              return `Submission failed: ${err}`;
            },
          });
        } catch (error) {
          console.error("Submission error:", error);
          setSubmitting(false);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("Local Test Data:", submissionData);
        setSubmitting(true);
        toast.info("Submitting request... (Local Test)");
        setTimeout(() => {
          setSubmitted(true);
          setLoading(false);
          setSubmitting(false);
        }, 1500);
      }
    },
  });
  // useEffect(() => {
  //   console.log(stage);
  // }, [stage]);

  return (
    <>
      <div className="bg-white w-xl h-xl rounded-xl p-6 space-y-5">
        <div className="flex flex-row justify-between">
          <div className="text-black">
            <p className="font-text md:text-base text-xs">Application for</p>
            <h1 className="md:text-4xl text-xl">Leave Form</h1>
          </div>
          <div>
            <p className="text-gray-500">{stage + 1} of 3</p>
          </div>
        </div>
        <form onSubmit={formik.handleSubmit}>
          {stage === 0 ? (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between">
                  <label
                    className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <p className="text-sm text-gray-500">Required</p>
                </div>
                <input
                  className="border text-black border-gray-300 rounded-md p-2 w-full "
                  id="email"
                  name="email"
                  type="text"
                  placeholder="example@email.com"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                />
                {formik.touched.email && formik.errors.email ? (
                  <p className="text-sm text-red-600">{formik.errors.email}</p>
                ) : null}
              </div>
              <div>
                <div className="flex flex-row justify-between">
                  <label
                    className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                    htmlFor="fullName"
                  >
                    Full Name
                  </label>
                  <p className="text-sm text-gray-500">Required</p>
                </div>
                <input
                  className="border text-black border-gray-300 rounded-md p-2 w-full "
                  id="fullName"
                  name="fullName"
                  type="text"
                  pattern="^[a-zA-Z\s.,]+$"
                  placeholder="Last Name, First Name, Middle Name "
                  maxLength="50"
                  minLength="5"
                  onBlur={formik.handleBlur}
                  onChange={(e) => {
                    const onlyLetters = e.target.value.replace(
                      /[^a-zA-Z\s.,\-]/g,
                      "",
                    );
                    formik.setFieldValue("fullName", onlyLetters);
                  }}
                  value={formik.values.fullName}
                />
                {formik.touched.fullName && formik.errors.fullName ? (
                  <p className="text-sm text-red-600">
                    {formik.errors.fullName}
                  </p>
                ) : null}
              </div>
              <div>
                <div className="flex flex-row justify-between">
                  <label
                    className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                    htmlFor="office"
                  >
                    Office/Department
                  </label>
                  <p className="text-sm text-gray-500">Required</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="border border-gray-200 p-2 rounded-md w-full text-left hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                      <span
                        className={`${formik.values.office ? "text-black" : "text-gray-500"}`}
                      >
                        {formik.values.office ||
                          "Select your office/department"}
                      </span>
                      <ChevronDown
                        className={`${formik.values.office ? "text-black" : "text-gray-500"}`}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={formik.values.office}
                      onValueChange={(value) =>
                        formik.setFieldValue("office", value)
                      }
                      onBlur={formik.handleBlur}
                    >
                      {officeOptions.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>
                          {option}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {formik.touched.office && formik.errors.office ? (
                  <p className="text-sm text-red-600">{formik.errors.office}</p>
                ) : null}
              </div>
              {formik.values.office === "Others" ? (
                <>
                  <div>
                    <div className="flex flex-row justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb"
                        htmlFor="otherOfficesAndPostion"
                      >
                        Other Office Specification
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <input
                      className="border text-black border-gray-300 rounded-md p-2 w-full "
                      id="otherOfficesAndPostion"
                      name="otherOfficesAndPostion"
                      type="text"
                      maxLength={50}
                      onBlur={formik.handleBlur}
                      placeholder="If not in the dropdown list, please specify"
                      onChange={formik.handleChange}
                      value={formik.values.otherOfficesAndPostion}
                    />
                    {formik.touched.otherOfficesAndPostion &&
                    formik.errors.otherOfficesAndPostion ? (
                      <p className="text-sm text-red-600">
                        {formik.errors.otherOfficesAndPostion}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
              <div>
                <div className="flex flex-row justify-between">
                  <label
                    className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                    htmlFor="position"
                  >
                    Position
                  </label>
                  <p className="text-sm text-gray-500">Required</p>
                </div>
                <input
                  className="border text-black border-gray-300 rounded-md p-2 w-full "
                  id="position"
                  name="position"
                  type="text"
                  maxLength={50}
                  onBlur={formik.handleBlur}
                  placeholder="Your current position"
                  onChange={formik.handleChange}
                  value={formik.values.position}
                />
                {formik.touched.position && formik.errors.position ? (
                  <p className="text-sm text-red-600">
                    {formik.errors.position}
                  </p>
                ) : null}
              </div>
              <div>
                <div className="flex flex-row justify-between">
                  <label
                    className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                    htmlFor="salaryGrade"
                  >
                    Salary Grade
                  </label>
                  <p className="text-sm text-gray-500">Required</p>
                </div>
                <input
                  className="border text-black border-gray-300 rounded-md p-2 w-full "
                  id="salaryGrade"
                  name="salaryGrade"
                  type="text"
                  maxLength={4}
                  placeholder="Your current salary grade"
                  onBlur={formik.handleBlur}
                  onChange={(e) => {
                    const onlySG = e.target.value.replace(/[^0-9]/g, "");
                    formik.setFieldValue("salaryGrade", "SG" + onlySG);
                  }}
                  value={formik.values.salaryGrade}
                />
                {formik.touched.salaryGrade && formik.errors.salaryGrade ? (
                  <p className="text-sm text-red-600">
                    {formik.errors.salaryGrade}
                  </p>
                ) : null}
              </div>
            </div>
          ) : stage === 1 ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-medium text-gray-700">
                  Details of Leave Application
                </h1>
                <p className="text-sm text-gray-500">
                  Please provide the details of application within the form;
                  specify each option when needed
                </p>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild type="button">
                    <div className="border border-gray-200 p-2 rounded-md w-full text-left hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                      <span
                        className={`${formik.values.typeOfLeave ? "text-black" : "text-gray-500"}`}
                      >
                        {formik.values.typeOfLeave || "Select type of leave"}
                      </span>
                      <ChevronDown
                        className={`${formik.values.typeOfLeave ? "text-black" : "text-gray-500"}`}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={formik.values.typeOfLeave}
                      onValueChange={(value) => {
                        formik.setFieldValue("typeOfLeave", value);
                        formik.setFieldValue(
                          "vacationSpecialPrivilegeLeaveSpecifications",
                          "",
                        );
                        formik.setFieldValue("abroadSpecification", "");
                        formik.setFieldValue("sickLeaveSpecification", "");
                        formik.setFieldValue("inHospitalSpecification", "");
                        formik.setFieldValue("outpatientSpecification", "");
                        formik.setFieldValue(
                          "specialLeaveBenefitsForWomenSpecification",
                          "",
                        );
                        formik.setFieldValue("studyLeaveReason", "");
                        formik.setFieldValue("otherSpecification", "");
                        formik.setFieldValue("otherPurposeSpecification", "");
                      }}
                    >
                      {typeOfLeaveOptions.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>
                          {option}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {formik.touched.typeOfLeave && formik.errors.typeOfLeave ? (
                  <p className="text-sm text-red-500">
                    {formik.errors.typeOfLeave}
                  </p>
                ) : null}
              </div>
              {formik.values.typeOfLeave ===
                "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ||
              formik.values.typeOfLeave ===
                "Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ? (
                <>
                  <div>
                    <div className="flex justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="vacationSpecialPrivilegeLeaveSpecifications"
                      >
                        Vacation/Special Privilege Leave Specification
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <div className="flex flex-row text-black justify-between w-full gap-4">
                      <div className="flex flex-row w-full justify-around gap-4">
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.vacationSpecialPrivilegeLeaveSpecifications === "Within the Philippines" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "vacationSpecialPrivilegeLeaveSpecifications",
                              "Within the Philippines",
                            )
                          }
                        >
                          <label htmlFor="vacationSpecialPrivilegeLeaveSpecificationsYes">
                            Within the Philippines
                          </label>
                          <input
                            type="radio"
                            id="vacationSpecialPrivilegeLeaveSpecificationsYes"
                            name="vacationSpecialPrivilegeLeaveSpecifications"
                            value="Within the Philippines"
                            checked={
                              formik.values
                                .vacationSpecialPrivilegeLeaveSpecifications ===
                              "Within the Philippines"
                            }
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.vacationSpecialPrivilegeLeaveSpecifications === "Abroad" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "vacationSpecialPrivilegeLeaveSpecifications",
                              "Abroad",
                            )
                          }
                        >
                          <label htmlFor="vacationSpecialPrivilegeLeaveSpecificationsNo">
                            Abroad
                          </label>
                          <input
                            type="radio"
                            id="vacationSpecialPrivilegeLeaveSpecificationsNo"
                            name="vacationSpecialPrivilegeLeaveSpecifications"
                            value="Abroad"
                            checked={
                              formik.values
                                .vacationSpecialPrivilegeLeaveSpecifications ===
                              "Abroad"
                            }
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                      </div>
                    </div>
                    {formik.errors
                      .vacationSpecialPrivilegeLeaveSpecifications ? (
                      <p className="text-sm text-red-600">
                        {
                          formik.errors
                            .vacationSpecialPrivilegeLeaveSpecifications
                        }
                      </p>
                    ) : null}
                  </div>
                  <div>
                    {formik.values
                      .vacationSpecialPrivilegeLeaveSpecifications ===
                    "Abroad" ? (
                      <div>
                        <div className="flex justify-between">
                          <label
                            className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                            htmlFor="abroadSpecification"
                          >
                            {" "}
                            Specify the country to be visited
                          </label>
                          <p className="text-sm text-gray-500">Required</p>
                        </div>
                        <input
                          className="border text-black border-gray-300 rounded-md p-2 w-full "
                          id="abroadSpecification"
                          name="abroadSpecification"
                          type="text"
                          placeholder="Enter abroad specification"
                          onChange={formik.handleChange}
                          value={formik.values.abroadSpecification}
                          onBlur={formik.handleBlur}
                        />
                        {formik.touched.abroadSpecification &&
                        formik.errors.abroadSpecification ? (
                          <p className="text-sm text-red-600">
                            {formik.errors.abroadSpecification}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : formik.values.typeOfLeave ===
                "Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ? (
                <>
                  <div>
                    <div className="flex justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="sickLeaveSpecification"
                      >
                        Specify if the employee is an In Hospital or Outpatient
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <div className="flex flex-row text-black justify-between w-full gap-4">
                      <div className="flex flex-row w-full justify-around gap-4">
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.sickLeaveSpecification === "In Hospital" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "sickLeaveSpecification",
                              "In Hospital",
                            )
                          }
                        >
                          <label htmlFor="sickLeaveSpecificationYes">
                            In Hospital
                          </label>
                          <input
                            type="radio"
                            id="sickLeaveSpecificationYes"
                            name="sickLeaveSpecification"
                            value="In Hospital"
                            checked={
                              formik.values.sickLeaveSpecification ===
                              "In Hospital"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.sickLeaveSpecification === "Outpatient" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "sickLeaveSpecification",
                              "Outpatient",
                            )
                          }
                        >
                          <label htmlFor="sickLeaveSpecificationNo">
                            Outpatient
                          </label>
                          <input
                            type="radio"
                            id="sickLeaveSpecificationNo"
                            name="sickLeaveSpecification"
                            value="Outpatient"
                            checked={
                              formik.values.sickLeaveSpecification ===
                              "Outpatient"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    {formik.touched.sickLeaveSpecification &&
                    formik.errors.sickLeaveSpecification ? (
                      <p className="text-sm text-red-600">
                        {formik.errors.sickLeaveSpecification}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    {formik.values.sickLeaveSpecification === "In Hospital" ? (
                      <div>
                        <div className="flex justify-between gap-2">
                          <label
                            className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                            htmlFor="inHospitalSpecification"
                          >
                            Please specify the nature of the illness requiring
                            the employee's inpatient hospitalization
                          </label>
                          <p className="text-sm text-gray-500">Required</p>
                        </div>
                        <input
                          className="border text-black border-gray-300 rounded-md p-2 w-full "
                          id="inHospitalSpecification"
                          name="inHospitalSpecification"
                          type="text"
                          placeholder="Enter specification"
                          onChange={formik.handleChange}
                          maxLength={50}
                          value={formik.values.inHospitalSpecification}
                        />
                        {formik.touched.inHospitalSpecification &&
                        formik.errors.inHospitalSpecification ? (
                          <p className="text-sm text-red-600">
                            {formik.errors.inHospitalSpecification}
                          </p>
                        ) : null}
                      </div>
                    ) : formik.values.sickLeaveSpecification ===
                      "Outpatient" ? (
                      <div>
                        <div className="flex justify-between gap-2">
                          <label
                            className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                            htmlFor="outpatientSpecification"
                          >
                            Please specify the medical condition for which the
                            employee is receiving outpatient treatment.
                          </label>
                          <p className="text-sm text-gray-500">Required</p>
                        </div>
                        <input
                          className="border text-black border-gray-300 rounded-md p-2 w-full "
                          id="outpatientSpecification"
                          name="outpatientSpecification"
                          type="text"
                          placeholder="Enter specification"
                          onChange={formik.handleChange}
                          maxLength={50}
                          value={formik.values.outpatientSpecification}
                        />
                        {formik.touched.outpatientSpecification &&
                        formik.errors.outpatientSpecification ? (
                          <p className="text-sm text-red-600">
                            {formik.errors.outpatientSpecification}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : formik.values.typeOfLeave ===
                "Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)" ? (
                <>
                  <div>
                    <div className="flex justify-between gap-2">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="specialLeaveBenefitsForWomenSpecification"
                      >
                        Please specify the details for Special Leave Benefits
                        for Women
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <input
                      className="border text-black border-gray-300 rounded-md p-2 w-full "
                      id="specialLeaveBenefitsForWomenSpecification"
                      name="specialLeaveBenefitsForWomenSpecification"
                      type="text"
                      placeholder="Enter specification"
                      onChange={formik.handleChange}
                      value={
                        formik.values.specialLeaveBenefitsForWomenSpecification
                      }
                    />
                    {formik.touched.specialLeaveBenefitsForWomenSpecification &&
                    formik.errors.specialLeaveBenefitsForWomenSpecification ? (
                      <p className="text-sm text-red-600">
                        {
                          formik.errors
                            .specialLeaveBenefitsForWomenSpecification
                        }
                      </p>
                    ) : null}
                  </div>
                </>
              ) : formik.values.typeOfLeave ===
                "Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ? (
                <>
                  <div>
                    <div className="flex justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="studyLeaveReason"
                      >
                        Specify the reason of study leave within the option
                        given
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <div className="flex flex-row text-black justify-between w-full gap-4">
                      <div className="flex flex-row w-full justify-around gap-4">
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.studyLeaveReason === "completionOfMastersDegree" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "studyLeaveReason",
                              "completionOfMastersDegree",
                            )
                          }
                        >
                          <label htmlFor="completionOfMastersDegree">
                            Completion of Master's Degree
                          </label>
                          <input
                            type="radio"
                            id="completionOfMastersDegree"
                            name="completionOfMastersDegree"
                            value="completionOfMastersDegree"
                            checked={
                              formik.values.studyLeaveReason ===
                              "completionOfMastersDegree"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.studyLeaveReason === "barBoardExaminationReview" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "studyLeaveReason",
                              "barBoardExaminationReview",
                            )
                          }
                        >
                          <label htmlFor="barBoardExaminationReview">
                            BAR/Board Examination Review
                          </label>
                          <input
                            type="radio"
                            id="barBoardExaminationReview"
                            name="barBoardExaminationReview"
                            value="barBoardExaminationReview"
                            checked={
                              formik.values.studyLeaveReason ===
                              "barBoardExaminationReview"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    {formik.touched.studyLeaveReason &&
                    formik.errors.studyLeaveReason ? (
                      <p className="text-sm text-red-600">
                        {formik.errors.studyLeaveReason}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : formik.values.typeOfLeave === "Others" ? (
                <>
                  <div>
                    <div className="flex justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="otherSpecification"
                      >
                        {" "}
                        Specify which type of leave the employee wants to avail
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <input
                      className="border text-black border-gray-300 rounded-md p-2 w-full "
                      id="otherSpecification"
                      name="otherSpecification"
                      type="text"
                      maxLength={50}
                      placeholder="Enter other specification"
                      onChange={formik.handleChange}
                      value={formik.values.otherSpecification}
                    />
                    {formik.touched.otherSpecification &&
                    formik.errors.otherSpecification ? (
                      <p className="text-sm text-red-600">
                        {formik.errors.otherSpecification}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <label
                        className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                        htmlFor="sickLeaveSpecification"
                      >
                        What the purpose of the employee on availing the leave
                      </label>
                      <p className="text-sm text-gray-500">Required</p>
                    </div>
                    <div className="flex flex-row text-black justify-between w-full gap-4">
                      <div className="flex flex-row w-full justify-around gap-4">
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.otherPurposeSpecification === "Monetization of Leave Credits" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "otherPurposeSpecification",
                              "Monetization of Leave Credits",
                            )
                          }
                        >
                          <label htmlFor="">
                            Monetization of Leave Credits
                          </label>
                          <input
                            type="radio"
                            id="otherPurposeSpecificationYes"
                            name="otherPurposeSpecification"
                            value="Monetization of Leave Credits"
                            checked={
                              formik.values.otherPurposeSpecification ===
                              "Monetization of Leave Credits"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                        <div
                          className={`border border-gray-300 rounded-sm w-full md:p-4 p-2 cursor-pointer justify-between flex hover:bg-accent ${formik.values.otherPurposeSpecification === "Terminal Leave" ? "bg-accent" : ""}`}
                          onClick={() =>
                            formik.setFieldValue(
                              "otherPurposeSpecification",
                              "Terminal Leave",
                            )
                          }
                        >
                          <label htmlFor="otherPurposeSpecificationNo">
                            Terminal Leave
                          </label>
                          <input
                            type="radio"
                            id="otherPurposeSpecificationNo"
                            name="otherPurposeSpecification"
                            value="Terminal Leave"
                            checked={
                              formik.values.otherPurposeSpecification ===
                              "Terminal Leave"
                            }
                            onChange={formik.handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    {formik.touched.otherPurposeSpecification &&
                    formik.errors.otherPurposeSpecification ? (
                      <p className="text-sm text-red-600">
                        {formik.errors.otherPurposeSpecification}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ) : stage === 2 ? (
            <>
              <div className="space-y-5">
                <div>
                  <h1 className="text-lg font-medium text-gray-700">
                    Duration of Leave
                  </h1>
                  <p className="text-sm text-gray-500">
                    {" "}
                    The total length of time an employee is away from work,
                    typically defined by specific start and end dates.
                  </p>
                </div>
                <div>
                  <div>
                    <label
                      className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                      htmlFor="dateTypes"
                    >
                      How long the duration for your leave
                    </label>
                    <div className="flex flex-row gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild type="button">
                          <div className="border border-gray-200 p-2 rounded-md w-full text-left hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                            <span
                              className={`${formik.values.dateTypes ? "text-black" : "text-gray-500"}`}
                            >
                              {formik.values.dateTypes === "single"
                                ? "A Single Day"
                                : formik.values.dateTypes === "range"
                                  ? "A Range of Days"
                                  : formik.values.dateTypes === "multiple"
                                    ? "Multiple Days"
                                    : "Select duration type"}
                            </span>
                            <ChevronDown
                              className={`${formik.values.dateTypes ? "text-black" : "text-gray-500"}`}
                            />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup
                            value={formik.values.dateTypes}
                            onValueChange={(value) => {
                              formik.setValues({
                                ...formik.values,
                                startDate: null,
                                endDate: null,
                                dates: [],
                                dateTypes: value,
                              });
                            }}
                          >
                            <DropdownMenuRadioItem value="single">
                              A Single Day
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="range">
                              A Range of Days
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="multiple">
                              A Multiple Days
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                {formik.values.dateTypes === "range" ? (
                  <>
                    <div>
                      <div className="flex flex-row gap-4 items-end">
                        <Popover>
                          <PopoverTrigger className="flex flex-row gap-2 w-full justify-between items-center cursor-pointer">
                            {/* <div className={`border flex flex-row items-center justify-between text-black border-gray-300 rounded-md p-2 w-fit h-fit aspect-square ${formik.values.dates && formik.values.dates.length > 0 ? "text-black" : "text-gray-500"}`}>
                                                <Calendar1 className={`${formik.values.Issue_On ? "text-black" : "text-gray-500"}`}/>
                                            </div> */}

                            <div className="flex flex-col gap-2 flex-1 text-left">
                              <p className="font-text block text-sm font-medium text-gray-700 text-left">
                                Starting Date
                              </p>
                              <div
                                className={`border border-gray-300 rounded-md p-2 w-full ${formik.values.startDate ? "text-black" : "text-gray-500"}`}
                              >
                                {formik.values.startDate
                                  ? format(
                                      formik.values.startDate,
                                      "MMM dd yyyy",
                                    )
                                  : "Select a date"}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-1  text-left">
                              <p className="font-text block text-sm font-medium text-gray-700 text-left">
                                Ending Date
                              </p>
                              <div
                                className={`border border-gray-300 rounded-md p-2 w-full ${formik.values.endDate ? "text-black" : "text-gray-500"}`}
                              >
                                {formik.values.endDate
                                  ? format(formik.values.endDate, "MMM dd yyyy")
                                  : "Select a date"}
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className={"p-0 w-fit"}>
                            <Calendar
                              mode={
                                formik.values.dateTypes === "single"
                                  ? "single"
                                  : formik.values.dateTypes === "range"
                                    ? "range"
                                    : "multiple"
                              }
                              numberOfMonths={2}
                              defaultMonth={new Date()}
                              disabled={(currentDate) => {
                                const day = currentDate.getDay();
                                if (day === 0 || day === 6) return true;
                                return hd.some((holiday) =>
                                  isSameDay(
                                    parseISO(holiday.date),
                                    currentDate,
                                  ),
                                );
                              }}
                              selected={{
                                from: formik.values.startDate
                                  ? formik.values.startDate
                                  : new Date(),
                                to: formik.values.endDate
                                  ? formik.values.endDate
                                  : new Date(),
                              }}
                              onSelect={(date) => {
                                formik.setFieldValue("startDate", date.from);
                                formik.setFieldValue("endDate", date.to);
                              }}
                              className="rounded-lg border"
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {(formik.touched.startDate && formik.errors.startDate) ||
                      (formik.touched.endDate && formik.errors.endDate) ? (
                        <p className="text-sm text-red-600">
                          {formik.errors.startDate || formik.errors.endDate}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : formik.values.dateTypes === "single" ? (
                  <>
                    <div>
                      <div className="relative items-center justify-center gap-2">
                        <div>
                          <label
                            className="font-text block text-sm font-medium text-gray-700 text-left mb-2"
                            htmlFor="Issue_On"
                          >
                            Select the date/s of your leave
                          </label>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className={`border flex flex-row items-center justify-between text-black border-gray-300 rounded-md p-2 w-full ${formik.values.singleDate && formik.values.singleDate.length > 0 ? "text-black" : "text-gray-500"}`}
                            >
                              {formik.values.singleDate
                                ? format(formik.values.singleDate, "MMM dd")
                                : "Select a date"}
                              <Calendar1
                                className={`${formik.values.singleDate ? "text-black" : "text-gray-500"}`}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className={"p-0 w-fit"}>
                            <Calendar
                              mode={
                                formik.values.dateTypes === "single"
                                  ? "single"
                                  : formik.values.dateTypes === "range"
                                    ? "range"
                                    : "multiple"
                              }
                              numberOfMonths={2}
                              defaultMonth={new Date()}
                              disabled={(currentDate) => {
                                const day = currentDate.getDay();
                                if (day === 0 || day === 6) return true;
                                return hd.some((holiday) =>
                                  isSameDay(
                                    parseISO(holiday.date),
                                    currentDate,
                                  ),
                                );
                              }}
                              selected={
                                formik.values.singleDate
                                  ? formik.values.singleDate
                                  : null
                              }
                              onSelect={(date) => {
                                formik.setFieldValue(
                                  "singleDate",
                                  date || null,
                                );
                              }}
                              className="rounded-lg border"
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {formik.touched.singleDate && formik.errors.singleDate ? (
                        <p className="text-sm text-red-600">
                          {formik.errors.singleDate}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex flex-row gap-4 items-end">
                        <div className="flex flex-col gap-2 flex-1">
                          Number of Selected Days{" "}
                          {formik.values.dates ? formik.values.dates.length : 0}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className={`border flex flex-row items-center justify-between text-black border-gray-300 rounded-md p-2 w-fit h-fit aspect-square ${formik.values.dates && formik.values.dates.length > 0 ? "text-black" : "text-gray-500"}`}
                            >
                              <Calendar1
                                className={`${formik.values.Issue_On ? "text-black" : "text-gray-500"}`}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className={"p-0 w-fit"}>
                            <Calendar
                              mode={
                                formik.values.dateTypes === "single"
                                  ? "single"
                                  : formik.values.dateTypes === "range"
                                    ? "range"
                                    : "multiple"
                              }
                              numberOfMonths={2}
                              defaultMonth={new Date()}
                              disabled={(currentDate) => {
                                const day = currentDate.getDay();
                                if (day === 0 || day === 6) return true;
                                return hd.some((holiday) =>
                                  isSameDay(
                                    parseISO(holiday.date),
                                    currentDate,
                                  ),
                                );
                              }}
                              selected={
                                formik.values.dates ? formik.values.dates : []
                              }
                              onSelect={(date) => {
                                const selectedDate = date || null;
                                formik.setFieldValue(
                                  "singleDate",
                                  selectedDate,
                                );
                                // Synchronize with the main start/end fields so validation passes
                                formik.setFieldValue("startDate", selectedDate);
                                formik.setFieldValue("endDate", selectedDate);
                              }}
                              className="rounded-lg border"
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {formik.touched.dates && formik.errors.dates ? (
                        <p className="text-sm text-red-600">
                          {formik.errors.dates}
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}

          <div className="flex flex-row gap-5">
            {stage > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setStage((prev) => prev - 1);
                }}
                disabled={submitting}
                className="w-full flex flex-row justify-between mt-5 text-gray-700 font-text rounded-md hover:bg-gray-400 p-4 transition-all ease-in-out cursor-pointer border border-gray-300"
              >
                <ChevronLeft className="mr-2" />
                <p>Back</p>
              </button>
            ) : null}
            {stage < 2 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNext(formik);
                }}
                className="w-full flex flex-row justify-between mt-5 bg-gray-800 text-white font-text rounded-md hover:bg-gray-700 p-4 transition-all ease-in-out cursor-pointer"
              >
                <p>Next</p>
                <ChevronRight className="ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex flex-row justify-between mt-5 bg-gray-800 text-white font-text rounded-md hover:bg-gray-700 p-4 transition-all ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p>{submitting ? "Submitting..." : "Submit Application"}</p>
                <ChevronRight className="ml-2" />
              </button>
            )}
          </div>

          {/* <button type="submit" className='w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300'>Submit</button> */}
        </form>
      </div>
    </>
  );
}
