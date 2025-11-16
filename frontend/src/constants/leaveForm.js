// src/constants/leaveForm.js

export const leaveFormFields = () => [
  { name: "employeeId", hidden: true },
  { name: "departmentId", hidden: true },
  {
    label: "Leave Type",
    name: "leaveType",
    type: "AutoComplete",
    source: `/populate/read/employees/:userId`,
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
          {
            $unwind: {
              path: "$departmentDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "leavepolicies",
              localField: "departmentDetails.leavePolicy",
              foreignField: "_id",
              as: "leavePolicyDetails",
            },
          },
          {
            $unwind: {
              path: "$leavePolicyDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "statusgroups",
              localField: "leavePolicyDetails.leaveStatusGroup",
              foreignField: "_id",
              as: "sg",
            },
          },
          {
            $addFields: {
              defaultStatus: {
                $first: {
                  $filter: {
                    input: { $ifNull: [ { $arrayElemAt: ["$sg.statusArray", 0] }, [] ] },
                    as: "item",
                    cond: { $eq: ["$$item.orderKey", 0] },
                  },
                },
              },
            },
          },
          {
            $unwind: {
              path: "$leavePolicyDetails.leaves",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "leavetypes",
              localField: "leavePolicyDetails.leaves.leaveType",
              foreignField: "_id",
              as: "leaveTypeInfo",
            },
          },
          {
            $unwind: {
              path: "$leaveTypeInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: "$leaveTypeInfo._id",
              departmentName: "$departmentDetails.name",
              departmentId: "$departmentDetails._id",
              leaveTypeId: "$leaveTypeInfo._id",
              name: "$leaveTypeInfo.name",
              statusId: "$defaultStatus.statusDetails",
              orderKey: "$defaultStatus.orderKey",
            },
          },
        ],
      },
    },
    placeholder: "Select leave type",
    required: true,
    orderKey: 3,
  },
  { name: "leaveTypeId", hidden: true },
  {
    label: "From Date",
    name: "startDate",
    type: "date",
    placeholder: "Select From Date",
    required: true,
    orderKey: 0,
  },
  {
    label: "To Date",
    name: "endDate",
    type: "date",
    placeholder: "Select To Date",
    required: true,
    orderKey: 1,
  },
  { name: "totalDays", hidden: true },
  {
    label: "Reason",
    name: "reason",
    type: "textarea",
    placeholder: "Enter reason for leave",
    orderKey: 4,
  },
  { name: "status", hidden: true },
  { name: "statusOrderKey", hidden: true },
  { name: "managerId", hidden: true },
];

export const leaveSubmitButton = {
  text: "Submit Leave Request",
  color: "blue",
};
