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
