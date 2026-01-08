export const leaveFormFields = (userData) => [
  // Hidden fields (set automatically)
  { name: "employeeId", hidden: true, value: userData._id },
  { name: "departmentId", hidden: true, value: userData.professionalInfo?.department },

  // Leave Type (using the same complex aggregate as the frontend)
  {
    name: "leaveTypeId",
    label: "Leave Type",
    type: "AutoComplete",
    source: `/populate/read/employees/${userData._id}`,
    dynamicOptions: {
      params: {
        aggregate: true,
        stages: [
          {
            $lookup: {
              from: "departments",
              localField: "professionalInfo.department",
              foreignField: "_id",
              as: "departmentDetails",
            },
          },
          { $unwind: "$departmentDetails" },
          {
            $lookup: {
              from: "leavepolicies",
              localField: "departmentDetails.leavePolicy",
              foreignField: "_id",
              as: "leavePolicyDetails",
            },
          },
          { $unwind: "$leavePolicyDetails" },
          { $unwind: "$leavePolicyDetails.leaves" },
          {
            $lookup: {
              from: "leavetypes",
              localField: "leavePolicyDetails.leaves.leaveType",
              foreignField: "_id",
              as: "leaveTypeInfo",
            },
          },
          { $unwind: "$leaveTypeInfo" },
          {
            $project: {
              _id: "$leaveTypeInfo._id",
              leaveTypeId: "$leaveTypeInfo._id",
              name: "$leaveTypeInfo.name",
              departmentId: "$departmentDetails._id",
            },
          },
        ],
      },
    },
    required: true,
    orderKey: 2,
  },

  // Calendar fields
  {
    name: "startDate",
    label: "From Date",
    type: "date",
    placeholder: "YYYY-MM-DD",
    required: true,
    orderKey: 0,
  },
  {
    name: "endDate",
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

