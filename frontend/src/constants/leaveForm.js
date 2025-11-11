// src/constants/leaveForm.js
export const leaveFormFields = [
  {
    label: "From Date",
    name: "formDate",
    type: "date",
    placeholder: "Select leave From date",
    required: true,
  },
  {
    label: "To Date",
    name : "toDate",
    type : "date",
    placeholder : "Select leave To Date",
    required : true
  },
  {
    label: "Leave Type",
    name: "leaveType",
    type: "AutoComplete",
    source : "/populate/read/leave", // 👈 link to dynamicOptions prop
    placeholder: "Select leave type",
    required: true,
  },
  {
    label : "Medical Certificate",
    name : "Document",
    type : "file",
  },
  {
    label: "Reason",
    name: "reason",
    type: "textarea",
    placeholder: "Enter reason for leave",
  },

  // Hidden Form fields
  {
    name :  "employeeId",
    hidden : true,
  },
  {
    name : "departmentId",
    hidden : true,
  },
  {
    name : "status",
    hidden : true,
  },
  {
    name : "managerId",
    hidden : true
  },
];

export const leaveSubmitButton = {
  text: "Submit Leave Request",
  color: "blue",
};
