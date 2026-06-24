import { milestoneFormFields, milestoneSubmitButton } from "./MilestoneForm";
import { referenceTypeFormFields, referenceTypeSubmitButton } from "./ReferenceTypeForm";
import { leadTypeFormFields, leadTypeSubmitButton } from "./LeadTypeForm";

const statusField = {
  name: "Status",
  label: "Status",
  type: "select",
  options: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ],
  defaultValue: "Active",
};

export const hrPolicyFormFields = [
  { name: "name", label: "Policy Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "content", label: "Policy Content", type: "textarea" },
  statusField,
];

export const leavePolicyFormFields = [
  { name: "name", label: "Policy Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  statusField,
];

export const attendancePolicyFormFields = [
  { name: "name", label: "Policy Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "fullDayHours", label: "Full Day Minimum Hours", type: "number", required: true, default: 8 },
  { name: "halfDayHours", label: "Half Day Minimum Hours", type: "number", required: true, default: 4 },
  { name: "graceMinutes", label: "Grace Minutes", type: "number", default: 15 },
  { name: "lateMarkThreshold", label: "Late Mark Threshold (Minutes)", type: "number", default: 15 },
  { name: "lateMarksForHalfDay", label: "Late Marks resulting in Half Day", type: "number", default: 3 },
  { name: "earlyExitThreshold", label: "Early Exit Threshold (Minutes)", type: "number", default: 15 },
  { name: "weeklyOffRules", label: "Weekly Off Rules (JSON)", type: "textarea", default: '{"type":"static","days":["Sunday"]}' },
  { name: "holidayRules", label: "Holiday Rules (JSON)", type: "textarea", default: '{"sandwich":false}' },
  { name: "lopRules", label: "LOP Rules (JSON)", type: "textarea", default: '{"deductFromLeaveBalance":true}' },
  statusField,
];

export const leaveTypeFormFields = [
  { name: "name", label: "Leave Type Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "maxDays", label: "Max Days", type: "number" },
  statusField,
];

export const shiftFormFields = [
  { name: "name", label: "Shift Name", type: "text", required: true },
  { name: "startTime", label: "Start Time", type: "time", required: true },
  { name: "endTime", label: "End Time", type: "time", required: true },
  statusField,
];

export const taskTypeFormFields = [
  { name: "name", label: "Task Type Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  statusField,
];

export const projectTypeFormFields = [
  { name: "name", label: "Project Type Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  statusField,
];

export const holidayFormFields = [
  { name: "name", label: "Holiday Name", type: "text", required: true },
  { name: "date", label: "Holiday Date", type: "date", required: true },
  { 
    name: "type", 
    label: "Holiday Type", 
    type: "select", 
    required: true,
    options: [
      { value: "national", label: "National" },
      { value: "regional", label: "Regional" },
      { value: "optional", label: "Optional" },
      { value: "company", label: "Company" },
    ]
  },
  { name: "applicableStates", label: "Applicable States (comma-separated)", type: "text" },
  { name: "year", label: "Year", type: "number", required: true },
];

const save = (text) => ({ text, color: "blue" });

export const hrPolicySubmit = save("Save HR Policy");
export const leavePolicySubmit = save("Save Leave Policy");
export const attendancePolicySubmit = save("Save Attendance Policy");
export const leaveTypeSubmit = save("Save Leave Type");
export const shiftSubmit = save("Save Shift");
export const taskTypeSubmit = save("Save Task Type");
export const projectTypeSubmit = save("Save Project Type");
export const holidaySubmit = save("Save Holiday");

export {
  milestoneFormFields,
  milestoneSubmitButton,
  referenceTypeFormFields,
  referenceTypeSubmitButton,
  leadTypeFormFields,
  leadTypeSubmitButton,
};
