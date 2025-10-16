import {  useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import {useAuth} from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance"

const AddDailyEntry = () => {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Array of activities: each = { taskType: "", description: "" }
  const [activities, setActivities] = useState([]);

  
  const fetchClients = async () => {
    const res = await axiosInstance.get("/populate/read/clients");
    setClients(res.data.data);
    console.log(res)
  };

  const fetchProject = async () =>{
    const res = await axiosInstance.get("/populate/read/projecttype");
    setProjects(res.data.data);
    console.log(res)
  }
  
  // Add new activity row
  const handleAddActivity = () => {
    if (activities.length < 30) {
      setActivities([...activities, { taskType: "", description: "" }]);
    } else {
      alert("Maximum 30 activities allowed");
    }
  };

  // Update activity value
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedProject || activities.length === 0) {
      alert("Please select client, project and add at least one activity.");
      return;
    }

    // Each activity will be sent as separate entry
    const payload = activities.map((act) => ({
      client: selectedClient._id,
      project: selectedProject._id,
      taskType: act.taskType,
      description: act.description,
      user: user?._id,
      date: new Date(),
    }));

    console.log("Payload:", payload);

    // Example API call
    // for (const entry of payload) {
    //   await fetch("/api/daily-activity", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(entry),
    //   });
    // }
  };

  return (
    <div className="flex flex-col gap-3 p-5 dark:text-white">
      <h2 className="text-2xl font-bold">Add Daily Activity</h2>
      <hr />
      <br />
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        {/* Client select */}
        <div className="flex flex-row gap-3 items-center mb-4 ">
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

          {/* Project select */}
          <Autocomplete
            className="w-1/3"
            options={projects}
            getOptionLabel={(option) => option.name || ""}
            onOpen={fetchProject}
            value={selectedProject}
            onChange={(event, newValue) => setSelectedProject(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Project"
                variant="outlined"
              />
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
        <div>
          {/* Activities list */}
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex flex-row gap-2 items-start p-2 rounded"
            >
              <TextField
                className="w-1/2"
                label="Task Type"
                variant="outlined"
                value={activity.taskType}
                onChange={(e) =>
                  handleChangeActivity(index, "taskType", e.target.value)
                }
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

        <div className="flex flex-col align-center items-center">
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
