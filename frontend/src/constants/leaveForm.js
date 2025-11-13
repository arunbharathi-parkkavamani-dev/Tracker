// src/constants/leaveForm.js

export const leaveFormFields = (user) => [
  {
    label: "From Date",
    name: "fromDate",
    type: "date",
    placeholder: "Select leave From date",
    required: true,
  },
  {
    label: "To Date",
    name: "toDate",
    type: "date",
    placeholder: "Select leave To Date",
    required: true,
  },
  {
    label: "Leave Type",
    name: "leaveType",
    type: "AutoComplete",
    source: `/populate/read/employees/${user.id}`,
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
              departmentName: "$departmentDetails.name",
              departmentId: "$departmentDetails._id",
              leaveTypeId: "$leaveTypeInfo._id",
              name: "$leaveTypeInfo.name",
            },
          },
        ],
      },
    },
    placeholder: "Select leave type",
    required: true,
  },
  {
    label: "Medical Certificate",
    name: "document",
    type: "file",
  },
  {
    label: "Reason",
    name: "reason",
    type: "textarea",
    placeholder: "Enter reason for leave",
  },
  // Hidden Fields
  { name: "employeeId", hidden: true },
  { name: "departmentId", hidden: true },
  { 
    name: "status", 
    hidden: true, 
    value: "69121b1cd664e361c6738b1f" 
  },
  { name: "managerId", hidden: true },
];

export const leaveSubmitButton = {
  text: "Submit Leave Request",
  color: "blue",
};
