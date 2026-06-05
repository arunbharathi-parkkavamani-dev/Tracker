export const departmentFormFields = [
  { name: "name", label: "Department Name", type: "text", required: true },
  { name: "shortCode", label: "Short Code", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "Status",
    label: "Status",
    type: "select",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    defaultValue: "Active",
  },
];

export const departmentSubmitButton = { text: "Save Department", color: "blue" };
