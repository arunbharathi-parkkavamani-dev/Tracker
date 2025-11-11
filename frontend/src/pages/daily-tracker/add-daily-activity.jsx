import React from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import FormRenderer from "../common/FormRenderer";
import ActivityEntryForm from "../../forms/ActivityEntryForm";

const AddDailyEntry = ({ onClose }) => {
  const { user } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      const { clientName, projectType, activities } = formData;

      if (!clientName || !projectType || !activities?.length) {
        alert("Please complete all required fields.");
        return;
      }

      const payload = activities.map((act) => ({
        client: clientName._id,
        projectType: projectType._id,
        taskType: act.taskType?._id,
        activity: act.description,
        user: user?.id,
        date: new Date(),
      }));

      await axiosInstance.post("/populate/create/dailyactivities", payload);
      alert("Daily entry saved successfully!");
      onClose();
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Failed to save entry.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-4xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Add Daily Activity</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>
      </div>

      <FormRenderer
        fields={ActivityEntryForm}
        submitButton={{ text: "Save Activity", color: "blue" }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddDailyEntry;
