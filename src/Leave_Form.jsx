import { useFormik } from "formik";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar1,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import * as Yup from "yup";
import { toast } from "sonner"; // Ensure you have this installed, or remove toast calls

export default function Leave_Form() {
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

  const [stage, setStage] = useState(0);
  const [submitted, setSubmitted] = useState(false); // FIXED: Added missing state

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
      ["startDate", "endDate"],
    ];

    const currentFields = stepFields[stage];

    const hasErrors = currentFields.some((field) => errors[field]);
    if (!hasErrors) {
      formik.setTouched({});
      // formik.setErrors({}); // Usually not needed to manually clear errors if validateForm returned none for these fields
      setStage((prev) => prev + 1);
    } else {
      const touchedFields = {};
      currentFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formik.setTouched(touchedFields);
      console.log("Validation errors:", errors);
    }
  };

  //Section validation for each stage of the form
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
        .max(10, "Salary Grade must be at most 10 characters")
        .min(2, "Salary Grade must be at least 2 characters")
        .matches(
          /^SG\d+$/,
          'Salary Grade must start with "SG" followed by numbers',
        ),
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
          then: () =>
            Yup.string().required(
              "Required to specify the country to be visited",
            ),
          otherwise: () => Yup.string().notRequired(),
        },
      ),
      sickLeaveSpecification: Yup.string().when("typeOfLeave", {
        is: "Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)",
        then: () =>
          Yup.string().required(
            "Required to specify if the employee is an In Hospital or Outpatient",
          ),
        otherwise: () => Yup.string().notRequired(),
      }),
      inHospitalSpecification: Yup.string().when(
        "sickLeaveSpecification",
        (value, schema) => {
          return value === "In Hospital"
            ? schema.required("Required to specify the details for In Hospital")
            : schema.notRequired();
        },
      ),
      outpatientSpecification: Yup.string().when(
        "sickLeaveSpecification",
        (value, schema) => {
          return value === "Outpatient"
            ? schema.required("Required to specify the details for Outpatient")
            : schema.notRequired();
        },
      ),
      specialLeaveBenefitsForWomenSpecification: Yup.string().when(
        "typeOfLeave",
        {
          is: "Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)",
          then: () =>
            Yup.string().required(
              "Required to specify the details for Special Leave Benefits for Women",
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
          Yup.string().required(
            "Required to specify which type of leave the employee wants to avail",
          ),
        otherwise: () => Yup.string().notRequired(),
      }),
    }),
    // STAGE 2 (FIXED: Added this missing schema)
    Yup.object({
      startDate: Yup.string().required("Start date is required"),
      endDate: Yup.string().required("End date is required"),
    }),
  ];

  const formik = useFormik({
    initialValues: {
      email: "",
      fullName: "",
      office: "",
      position: "",
      salaryGrade: "SG",
      typeOfLeave: "",
      vacationSpecialPrivilegeLeaveSpecifications: "",
      abroadSpecification: "",
      sickLeaveSpecification: "",
      inHospitalSpecification: "",
      outpatientSpecification: "",
      specialLeaveBenefitsForWomenSpecification: "",
      studyLeaveSpecification: "",
      otherSpecification: "",
      otherPurposeSpecification: "",
      startDate: "",
      endDate: "",
    },
    validationSchema: validationSchema[stage],
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      const submissionData = {
        ...values,
      };

      if (window.google && window.google.script) {
        const googleScriptPromise = new Promise((resolve, reject) => {
          window.google.script.run
            .withSuccessHandler((response) => {
              if (response && response.status === "success") {
                resolve(response);
              } else {
                reject(response.message || "Unknown error from server");
              }
            })
            .withFailureHandler((error) => {
              reject(error.message || error);
            })
            .saveForm(submissionData);
        });

        try {
          await toast.promise(googleScriptPromise, {
            loading: "Submitting request...",
            success: "Request submitted successfully!",
            error: (err) => `Submission failed: ${err}`,
          });

          resetForm();
          setSubmitted(true);
          // If you want to move to a "Thank you" page or Stage 3:
          setStage((prev) => prev + 1);
        } catch (error) {
          console.error("Submission error:", error);
        } finally {
          setSubmitting(false);
        }
      } else {
        // Fallback for local testing
        console.log("Local Test Data:", submissionData);
        alert("Google Script not found. Check console for data.");
        setSubmitting(false);
      }
    },
  });

  return (
    <>
      <div className="bg-white w-xl h-xl rounded-xl p-6 space-y-5">
        <div className="flex flex-row justify-between">
          <div className="text-black">
            <p className="font-text md:text-base text-xs">Application for</p>
            <h1 className="md:text-4xl text-xl">Leave Form</h1>
          </div>
          <div>
            {/* Display correct step count */}
            <p className="text-gray-500">{stage + 1} of 3</p>
          </div>
        </div>

        {/* Important: handleSubmit is bound here */}
        <form onSubmit={formik.handleSubmit}>
          {/* --- STAGE 0 --- */}
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
                      /[^a-zA-Z\s.,]/g,
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
          ) : /* --- STAGE 1 --- */
          stage === 1 ? (
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
                        // Reset all conditionals
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

              {/* Conditional Renders based on leave type */}
              {formik.values.typeOfLeave ===
                "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ||
              formik.values.typeOfLeave ===
                "Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" ? (
                <>
                  <div>
                    <div className="flex justify-between">
                      <label className="font-text block text-sm font-medium text-gray-700 text-left mb-2">
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
                          <label>Within the Philippines</label>
                          <input
                            type="radio"
                            name="vacationSpecialPrivilegeLeaveSpecifications"
                            value="Within the Philippines"
                            checked={
                              formik.values
                                .vacationSpecialPrivilegeLeaveSpecifications ===
                              "Within the Philippines"
                            }
                            onChange={formik.handleChange}
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
                          <label>Abroad</label>
                          <input
                            type="radio"
                            name="vacationSpecialPrivilegeLeaveSpecifications"
                            value="Abroad"
                            checked={
                              formik.values
                                .vacationSpecialPrivilegeLeaveSpecifications ===
                              "Abroad"
                            }
                            onChange={formik.handleChange}
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
                      <label className="font-text block text-sm font-medium text-gray-700 text-left mb-2">
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
                          <label>In Hospital</label>
                          <input
                            type="radio"
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
                          <label>Outpatient</label>
                          <input
                            type="radio"
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
          ) : /* --- STAGE 2 (FIXED DATE LOGIC) --- */
          stage === 2 ? (
            <>
              <div className="space-y-5">
                <div>
                  <h1 className="text-lg font-medium text-gray-700">
                    Duration of Leave
                  </h1>
                  <p className="text-sm text-gray-500">
                    The total length of time an employee is away from work,
                    typically defined by specific start and end dates.
                  </p>
                </div>
                <div className="relative items-center justify-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        // FIXED: Check startDate, not Issue_On
                        className={`border flex flex-row items-center justify-between text-black border-gray-300 rounded-md p-2 w-full ${formik.values.startDate ? "text-black" : "text-gray-500"}`}
                      >
                        {formik.values.startDate || formik.values.endDate
                          ? `${new Date(formik.values.startDate).toLocaleDateString()} - ${new Date(formik.values.endDate).toLocaleDateString()}`
                          : "Select a date"}
                        <Calendar1
                          // FIXED: Check startDate, not Issue_On
                          className={`${formik.values.startDate ? "text-black" : "text-gray-500"}`}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className={"p-0 w-fit"}>
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        defaultMonth={
                          formik.values.startDate
                            ? new Date(formik.values.startDate)
                            : undefined
                        }
                        selected={{
                          from: formik.values.startDate
                            ? new Date(formik.values.startDate)
                            : undefined,
                          to: formik.values.endDate
                            ? new Date(formik.values.endDate)
                            : undefined,
                        }}
                        onSelect={(dates) => {
                          formik.setFieldValue(
                            "startDate",
                            dates?.from ? dates.from.toISOString() : "",
                          );
                          formik.setFieldValue(
                            "endDate",
                            dates?.to ? dates.to.toISOString() : "",
                          );
                        }}
                        className="rounded-lg border"
                        captionLayout="dropdown"
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* FIXED: Display errors for startDate and endDate */}
                  {formik.touched.startDate && formik.errors.startDate ? (
                    <p className="text-sm text-red-600">
                      {formik.errors.startDate}
                    </p>
                  ) : formik.touched.endDate && formik.errors.endDate ? (
                    <p className="text-sm text-red-600">
                      {formik.errors.endDate}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          <div className="flex flex-row gap-5">
            {stage > 0 && stage !== 3 ? (
              <button
                type="button"
                onClick={() => {
                  setStage((prev) => prev - 1);
                }}
                className="w-full flex flex-row justify-between mt-5 text-gray-700 font-text rounded-md hover:bg-gray-400 p-4 transition-all ease-in-out cursor-pointer border border-gray-300"
              >
                <ChevronLeft className="mr-2" />
                <p>Back</p>
              </button>
            ) : null}

            {stage >= 0 && stage != 2 ? (
              <button
                type="button"
                onClick={() => handleNext(formik)}
                className="w-full flex flex-row justify-between mt-5 bg-gray-800 text-white font-text rounded-md hover:bg-gray-700 p-4 transition-all ease-in-out cursor-pointer"
              >
                <p>Next</p>
                <ChevronRight className="ml-2" />
              </button>
            ) : (
              // FIXED: Changed type="submit" and removed onClick={() => {}}
              <button
                type="submit"
                className="w-full flex flex-row justify-between mt-5 bg-gray-800 text-white font-text rounded-md hover:bg-gray-700 p-4 transition-all ease-in-out cursor-pointer"
              >
                <p>Submit</p>
                <ChevronRight className="ml-2" />
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
