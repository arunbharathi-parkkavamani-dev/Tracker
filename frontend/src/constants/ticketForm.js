export const TICKET_FORM_TABS = [
  {
    id: "details",
    label: "Details",
    fieldNames: [
      "title",
      "userStory",
      "product",
      "type",
      "priority",
      "dueDate",
      "assignedTo",
    ],
  },
  {
    id: "spec",
    label: "Specification",
    fieldNames: ["impactAnalysis", "url", "acceptanceCriteria", "description"],
  },
];

export const ticketFormFields = [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Brief description of the issue",
    gridClass: "col-span-2",
  },
  {
    name: "userStory",
    label: "User Story (Description)",
    type: "textarea",
    placeholder: "User story that will be visible to external clients...",
    rows: 4,
    gridClass: "col-span-2",
  },
  { name: "product", label: "Product", type: "text", placeholder: "Product name" },
  {
    name: "type",
    label: "Type",
    type: "AutoComplete",
    source: "",
    options: [
      { _id: "Bug", name: "Bug" },
      { _id: "Feature", name: "Feature" },
      { _id: "Enhancement", name: "Enhancement" },
      { _id: "Support", name: "Support" },
    ],
  },
  {
    name: "priority",
    label: "Priority",
    type: "AutoComplete",
    source: "",
    options: [
      { _id: "Low", name: "Low" },
      { _id: "Medium", name: "Medium" },
      { _id: "High", name: "High" },
      { _id: "Critical", name: "Critical" },
    ],
  },
  { name: "dueDate", label: "Due Date", type: "date" },
  {
    name: "assignedTo",
    label: "Assignees",
    type: "AutoComplete",
    multiple: true,
    source: "/populate/read/employees",
  },
  {
    name: "impactAnalysis",
    label: "Impact Analysis",
    type: "textarea",
    placeholder: "Impact analysis of the issue...",
    rows: 3,
    gridClass: "col-span-2",
  },
  {
    name: "url",
    label: "URL",
    type: "url",
    placeholder: "Related URL",
    gridClass: "col-span-2",
  },
  {
    name: "acceptanceCriteria",
    label: "Acceptance Criteria",
    type: "textarea",
    placeholder: "Acceptance criteria for completion...",
    rows: 3,
    gridClass: "col-span-2",
  },
  {
    name: "description",
    label: "Internal Description",
    type: "textarea",
    placeholder: "Internal notes (not visible to external clients)...",
    rows: 3,
    gridClass: "col-span-2",
  },
];

export const ticketSubmitButton = { text: "Save Ticket", color: "blue" };
