import React from "react";
import { useAuth } from "../../../context/authProvider";
import axiosInstance from "../../../api/axiosInstance";
import FormRenderer from "../../../components/Common/FormRenderer";
import ActivityEntryFrom from "../../../constants/ActivityEntryFrom";

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
        activity: act.activity,
        user: user?.id,
        date: new Date(),
      }));

      const res = await axiosInstance.post("/populate/create/dailyactivities", payload);
      alert("Daily entry saved successfully!", res);
      onClose();
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Failed to save entry.");
    }
  };

  return (
    <div className="bg-white p-1 rounded-2xl max-w-4xl w-full">
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
        fields={ActivityEntryFrom}
        submitButton={{ text: "Save Activity", color: "blue" }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddDailyEntry;
