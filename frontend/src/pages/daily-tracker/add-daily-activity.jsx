import { useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";

const AddDailyEntry = () => {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedProjectType, setSelectedProjectType] = useState(null);

  const [taskTypes, setTaskTypes] = useState([]);
  const [activities, setActivities] = useState([]);

  // Fetch clients
  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/clients");
      setClients(res.data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch project types for selected client
  const fetchProject = async () => {
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

  // Fetch task types
  const fetchTaskType = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/tasktypes");
      setTaskTypes(res.data.data || []);
    } catch (error) {
      console.error("Error fetching task types:", error);
    }
  };

  // Add new activity row
  const handleAddActivity = () => {
    if (activities.length < 30) {
      setActivities([...activities, { taskType: "", description: "" }]);
    } else {
      alert("Maximum 30 activities allowed");
    }
  };

  // Update activity field
  const handleChangeActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;
    setActivities(updated);
  };

  // Remove activity row
  const handleRemoveActivity = (index) => {
    const updated = [...activities];
    updated.splice(index, 1);
    setActivities(updated);
  };

  // Submit daily entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedProjectType || activities.length === 0) {
      alert("Please select client, project and add at least one activity.");
      return;
    }
    console.log(user)

    const payload = activities.map((act) => ({
      client: selectedClient._id,
      project: selectedProjectType._id,
      taskType: act.taskType,
      description: act.description,
      user: user?.id,
      date: new Date(),
    }));

    console.log(payload)

    try {
      await axiosInstance.post("/populate/create/dailyactivities", payload);
      alert("Daily entry saved successfully!");
      setActivities([]);
      setSelectedClient(null);
      setSelectedProjectType(null);
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 dark:text-white">
      <h2 className="text-2xl font-bold">Add Daily Activity</h2>
      <hr />
      <br />
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        {/* Client + Project Selection */}
        <div className="flex flex-row gap-3 items-center mb-4">
          <Autocomplete
            className="w-1/2"
            options={clients}
            getOptionLabel={(option) => option.name || ""}
            value={selectedClient}
            onOpen={fetchClients}
            onChange={(event, newValue) => setSelectedClient(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Client" variant="outlined" />
            )}
            isOptionEqualToValue={(option, value) => option._id === value._id}
          />

          <Autocomplete
            className="w-1/2"
            options={projectTypes}
            getOptionLabel={(option) => option.name || ""}
            value={selectedProjectType || null}
            onOpen={fetchProject}
            onChange={(event, newValue) => setSelectedProjectType(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Project Type" variant="outlined" />
            )}
            isOptionEqualToValue={(option, value) => option._id === value._id}
          />

          <button
            type="button"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleAddActivity}
          >
            Add Activity
          </button>
        </div>

        <hr />

        {/* Activities Section */}
        <div>
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex flex-row gap-2 items-start p-2 rounded"
            >
              <Autocomplete
                className="w-1/3"
                options={taskTypes}
                getOptionLabel={(option) => option.name || ""}
                onOpen={fetchTaskType}
                value={
                  taskTypes.find((t) => t._id === activity.taskType) || null
                }
                onChange={(event, newValue) =>
                  handleChangeActivity(
                    index,
                    "taskType",
                    newValue ? newValue._id : ""
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Task Type"
                    variant="outlined"
                  />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
              />

              <TextField
                className="w-1/2"
                label="Task Description"
                variant="outlined"
                multiline
                minRows={1}
                value={activity.description}
                onChange={(e) =>
                  handleChangeActivity(index, "description", e.target.value)
                }
              />

              <button
                type="button"
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                onClick={() => handleRemoveActivity(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDailyEntry;
