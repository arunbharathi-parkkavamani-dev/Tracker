export const leaveFormFields = (userData) => [
  // Hidden fields (set automatically)
  { name: "employeeId", hidden: true, value: userData._id },
  { name: "departmentId", hidden: true, value: userData.professionalInfo?.department },

  // Leave Type (simplified - get all leave types)
  {
    name: "leaveTypeId",
    label: "Leave Type",
    placeholder: "Select Leave Type",
    type: "AutoComplete",
    source: `/populate/read/leavetypes`,
    required: true,
    orderKey: 2,
  },

  // Calendar fields
  {
    name: "fromDate",
    label: "From Date",
    type: "date",
    placeholder: "YYYY-MM-DD",
    required: true,
    orderKey: 0,
  },
  {
    name: "toDate",
    label: "To Date",
    type: "date",
    placeholder: "YYYY-MM-DD",
    required: true,
    orderKey: 1,
  },

  // External read-only label (not submitted)
  {
    label: "Available Days",
    name: "availableDays",
    type: "label",
    external: true,
    orderKey: 3,
  },

  // backend computed value (hidden)
  { name: "totalDays", hidden: true },

  // Reason
  {
    label: "Reason",
    name: "reason",
    type: "textarea",
    numberOfLines: 4,
    required: true,
    orderKey: 4,
  },
];

export const leaveSubmitButton = {
  text: "Submit Leave Request",
  color: "blue",
};

