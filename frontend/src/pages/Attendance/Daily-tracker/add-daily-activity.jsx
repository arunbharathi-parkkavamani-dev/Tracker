import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authProvider";
import axiosInstance from "../../../api/axiosInstance";
import FormPageLayout from "../../../components/Forms/FormPageLayout";
import FormRenderer from "../../../components/Common/FormRenderer";
import ActivityEntryFrom from "../../../constants/ActivityEntryFrom";
import toast from "react-hot-toast";

const AddDailyEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      const { clientName, projectType, activities } = formData;

      if (!clientName || !projectType || !activities?.length) {
        toast.error("Please complete all required fields.");
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

      await axiosInstance.post("/populate/create/dailyactivities", payload);
      toast.success("Daily entry saved");
      navigate("/Attendance/Daily-tracker");
    } catch (err) {
      console.error("Error saving entry:", err);
      toast.error("Failed to save entry.");
    }
  };

  return (
    <FormPageLayout
      title="Add daily activity"
      subtitle="Log work against clients and project types"
      backTo="/Attendance/Daily-tracker"
      maxWidth="max-w-4xl"
    >
      <FormRenderer
        fields={ActivityEntryFrom}
        submitButton={{ text: "Save Activity", color: "blue" }}
        onSubmit={handleSubmit}
      />
    </FormPageLayout>
  );
};

export default AddDailyEntry;
