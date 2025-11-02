/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";

const AddDailyEntry = ({ onClose }) => {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedProjectType, setSelectedProjectType] = useState(null);
  const [taskTypes, setTaskTypes] = useState([]);
  const [activities, setActivities] = useState([
    { id: Date.now(), taskType: "", description: "" },
  ]);
  const [loading, setLoading] = useState(false);

  // --- Fetch Data ---
  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/clients");
      setClients(res.data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProjectTypes = async () => {
    if (!selectedClient?._id) return;
    try {
      const res = await axiosInstance.get(
        `/populate/read/clients/${selectedClient._id}?fields=projectTypes`
      );
      setProjectTypes(res.data.data?.projectTypes || []);
    } catch (error) {
      console.error("Error fetching project types:", error);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/tasktypes");
      setTaskTypes(res.data.data || []);
    } catch (error) {
      console.error("Error fetching task types:", error);
    }
  };

  // Refetch project types whenever client changes
  useEffect(() => {
    if (selectedClient) fetchProjectTypes();
  }, [selectedClient]);

  // --- Add / Update / Remove Activities ---
  const handleAddActivity = () => {
    if (activities.length >= 30) return alert("Maximum 30 activities allowed");
    setActivities([
      ...activities,
      { id: Date.now(), taskType: "", description: "" },
    ]);
  };

  const handleChangeActivity = (id, field, value) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === id ? { ...act, [field]: value } : act
      )
    );
  };

  const handleRemoveActivity = (id) => {
    setActivities((prev) => prev.filter((act) => act.id !== id));
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedProjectType || activities.length === 0) {
      alert("Please fill client, project and add at least one activity");
      return;
    }

    const payload = activities.map((act) => ({
      client: selectedClient._id,
      projectType: selectedProjectType._id,
      taskType: act.taskType,
      activity: act.description,
      user: user?.id,
      date: new Date(),
    }));

    setLoading(true);
    try {
      await axiosInstance.post("/populate/create/dailyactivities", payload);
      alert("Daily entry saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  // --- Component ---
  return (
    <div className="relative bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        onClick={onClose}
      >
        ✕
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">Add Daily Activity</h2>

        {/* Client + Project Type */}
        <div className="grid grid-cols-1 md:grid-row-2 gap-4">
          <Autocomplete
            options={clients}
            onOpen={fetchClients}
            getOptionLabel={(option) => option.name || ""}
            value={selectedClient}
            onChange={(e, newValue) => setSelectedClient(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Client"
                variant="outlined"
                required
              />
            )}
          />
          <Autocomplete
            onOpen={fetchProjectTypes}
            options={projectTypes}
            getOptionLabel={(option) => option.name || ""}
            value={selectedProjectType}
            onChange={(e, newValue) => setSelectedProjectType(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Project Type"
                variant="outlined"
                required
              />
            )}
          />
        </div>

        {/* Activities Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activities</h3>
          {activities.map((act) => (
            <div
              key={act.id}
              className=" rounded-lg bg-gray-50 relative "
            >
              {/* Remove Button (red dustbin) */}
              {activities.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(act.id)}
                  className="absolute top-[15px] right-[-25px] text-red-500 hover:text-red-700 text-lg"
                  title="Remove this task"
                >
                  ❌
                </button>
              )}

              <Autocomplete
                className="pb-2"
                fullWidth
                onOpen={fetchTaskTypes}
                options={taskTypes}
                getOptionLabel={(option) => option.name || ""}
                onChange={(e, value) =>
                  handleChangeActivity(act.id, "taskType", value?._id || "")
                }
                renderInput={(params) => (
                  <TextField {...params} label="Task Type" fullWidth />
                )}
              />

              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                minRows={2}
                value={act.description}
                onChange={(e) =>
                  handleChangeActivity(act.id, "description", e.target.value)
                }
                className="mt-3"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddActivity}
            className="text-blue-600 hover:underline mt-2"
          >
            + Add Another Task
          </button>
        </div>

        {/* User and Date */}
        <div className="pt-3 text-sm text-gray-600">
          <p>User: {user?.basicInfo?.firstName}</p>
          <p>{new Date().toLocaleString()}</p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Save Activity"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDailyEntry;
