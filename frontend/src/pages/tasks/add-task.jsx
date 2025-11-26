import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import FormRenderer from "../../components/Common/FormRenderer";
import TaskForm from "../../constants/taskForm";

const AddTask = ({ onClose }) => {
  const { user } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      const {
        clientName,
        projectType,
        taskType,
        title,
        referenceUrl,
        userStory,
        observation,
        impacts,
        acceptanceCreteria,
        attachments,
        assignee,
        priorityLevel,
        startDate,
        endDate,
        tags,
      } = formData;

      if (!clientName || !projectType || !taskType || !title) {
        alert("Please fill all required fields.");
        return;
      }

      const payload = {
        clientId: clientName._id,
        projectTypeId: projectType._id,
        taskTypeId: taskType._id,

        createdBy: user?.id,
        assignedTo: assignee?.map((a) => a._id) || [],

        title,
        referenceUrl,
        userStory,
        observation,
        impacts,
        acceptanceCreteria,

        priorityLevel: priorityLevel || "Low",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,

        tags: tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],

        attachments: attachments || [],

        // default system fields
        status: "Backlogs",
        followers: [user?.id], // optional — you can remove if not needed
      };

      await axiosInstance.post(
        "/populate/create/tasks",
        payload,
        { withCredentials: true }
      );

      alert("Task added successfully!");
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Task creation failed.");
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl max-w-3xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Add New Task</h2>
        <button className="text-gray-500 hover:text-gray-800 text-xl" onClick={onClose}>
          ✕
        </button>
      </div>

      <FormRenderer
        fields={TaskForm}
        submitButton={{ text: "Save Task", color: "blue" }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddTask;
