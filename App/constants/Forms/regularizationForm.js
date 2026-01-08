export const regularizationFormFields = [
    {
        label: "Request Date",
        name: "requestDate",
        type: "date",
        required: true,
        orderKey: 0,
    },
    {
        label: "Check-In Time",
        name: "requestedCheckIn",
        type: "time",
        required: true,
        orderKey: 1,
    },
    {
        label: "Check-Out Time",
        name: "requestedCheckOut",
        type: "time",
        required: true,
        orderKey: 2,
    },
    {
        label: "Reason",
        name: "reason",
        type: "textarea",
        placeholder: "Please provide reason for regularization...",
        required: true,
        numberOfLines: 4,
        orderKey: 3,
    },
];

export const regularizationSubmitButton = {
    text: "Submit Regularization",
    color: "green",
};
