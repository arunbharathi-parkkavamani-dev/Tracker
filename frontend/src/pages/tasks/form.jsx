import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import EntityFormPage from "../../components/Forms/EntityFormPage";
import {
  TASK_CREATE_TABS,
  buildTaskCreateFields,
} from "../../constants/taskCreateForm";
import toast from "react-hot-toast";

const TaskFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedClient = location.state?.selectedClient;
  const fields = buildTaskCreateFields(selectedClient);

  const handleSubmit = async (formData) => {
    try {
      await axiosInstance.post("/populate/create/tasks", {
        ...formData,
        createdBy: user.id,
        status: "Backlogs",
      });
      toast.success("Task created");
      navigate("/tasks");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
      throw err;
    }
  };

  return (
    <EntityFormPage
      title="Task"
      subtitle="Create a new task"
      backTo="/tasks"
      fields={fields}
      tabs={TASK_CREATE_TABS}
      submitButton={{ text: "Create Task", color: "blue" }}
      onSubmit={handleSubmit}
      maxWidth="max-w-4xl"
    />
  );
};

export default TaskFormPage;
