export const profileFormFields = (userData) => [
  // Profile Image
  {
    name: "basicInfo.profileImage",
    label: "Profile Image",
    type: "file",
    accept: "image/*",
    orderKey: 0,
  },

  // Basic Information
  {
    name: "basicInfo.firstName",
    label: "First Name",
    type: "text",
    placeholder: "Enter first name",
    required: true,
    orderKey: 1,
  },
  {
    name: "basicInfo.lastName",
    label: "Last Name", 
    type: "text",
    placeholder: "Enter last name",
    required: true,
    orderKey: 2,
  },
  {
    name: "basicInfo.email",
    label: "Personal Email",
    type: "email",
    placeholder: "Enter email address",
    orderKey: 3,
  },
  {
    name: "basicInfo.phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "Enter phone number",
    orderKey: 4,
  },
  {
    name: "basicInfo.dob",
    label: "Date of Birth",
    type: "date",
    placeholder: "YYYY-MM-DD",
    orderKey: 5,
  },
  {
    name: "basicInfo.maritalStatus",
    label: "Marital Status",
    type: "select",
    options: [
      { label: "Single", value: "Single" },
      { label: "Married", value: "Married" },
      { label: "Divorced", value: "Divorced" },
      { label: "Widowed", value: "Widowed" }
    ],
    orderKey: 6,
  },
  {
    name: "basicInfo.fatherName",
    label: "Father's Name",
    type: "text",
    placeholder: "Enter father's name",
    orderKey: 7,
  },
  {
    name: "basicInfo.motherName",
    label: "Mother's Name", 
    type: "text",
    placeholder: "Enter mother's name",
    orderKey: 8,
  },

  // Address Information
  {
    name: "basicInfo.address.street",
    label: "Street Address",
    type: "text",
    placeholder: "Enter street address",
    orderKey: 9,
  },
  {
    name: "basicInfo.address.country",
    label: "Country",
    type: "AutoComplete",
    source: "/api/countries",
    placeholder: "Select country",
    orderKey: 10,
  },
  {
    name: "basicInfo.address.state",
    label: "State",
    type: "AutoComplete",
    source: "/api/states/:countryId",
    dependsOn: "basicInfo.address.country",
    placeholder: "Select state",
    orderKey: 11,
  },
  {
    name: "basicInfo.address.city",
    label: "City",
    type: "AutoComplete",
    source: "/api/cities/:stateId",
    dependsOn: "basicInfo.address.state",
    placeholder: "Select city",
    orderKey: 12,
  },
  {
    name: "basicInfo.address.zip",
    label: "ZIP Code",
    type: "text",
    placeholder: "Enter ZIP code",
    orderKey: 13,
  },

  // Professional Information (Read-only for most users)
  {
    name: "professionalInfo.empId",
    label: "Employee ID",
    type: "text",
    placeholder: "Employee ID",
    readOnly: true,
    orderKey: 14,
  },
  {
    name: "authInfo.workEmail",
    label: "Work Email",
    type: "email",
    placeholder: "Work email address",
    readOnly: true,
    orderKey: 15,
  },

  // Account Details
  {
    name: "accountDetails.accountName",
    label: "Account Holder Name",
    type: "text",
    placeholder: "Enter account holder name",
    orderKey: 16,
  },
  {
    name: "accountDetails.accountNo",
    label: "Account Number",
    type: "text",
    placeholder: "Enter account number",
    orderKey: 17,
  },
  {
    name: "accountDetails.bankName",
    label: "Bank Name",
    type: "text",
    placeholder: "Enter bank name",
    orderKey: 18,
  },
  {
    name: "accountDetails.branch",
    label: "Branch",
    type: "text",
    placeholder: "Enter branch name",
    orderKey: 19,
  },
  {
    name: "accountDetails.ifscCode",
    label: "IFSC Code",
    type: "text",
    placeholder: "Enter IFSC code",
    orderKey: 20,
  },

  // Personal Documents
  {
    name: "personalDocuments.pan",
    label: "PAN Number",
    type: "text",
    placeholder: "Enter PAN number",
    orderKey: 21,
  },
  {
    name: "personalDocuments.aadhar",
    label: "Aadhar Number",
    type: "text",
    placeholder: "Enter Aadhar number",
    orderKey: 22,
  },
  {
    name: "personalDocuments.esi",
    label: "ESI Number",
    type: "text",
    placeholder: "Enter ESI number",
    orderKey: 23,
  },
  {
    name: "personalDocuments.pf",
    label: "PF Number",
    type: "text",
    placeholder: "Enter PF number",
    orderKey: 24,
  },
];

export const profileSubmitButton = {
  text: "Update Profile",
  color: "blue",
};