import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import Activity from "../Activity";
import FormPageLayout from "../../../../components/Forms/FormPageLayout";

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const populateFields = {
          projectType: "name",
          activityType: "name",
          client: "name",
          user: "basicInfo.firstName,basicInfo.lastName",
        };

        const response = await axiosInstance.post(`/populate/read/dailyactivities/${id}`, {
          populateFields,
        });

        setActivity(response.data.data);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchActivity();
  }, [id]);

  const handleClose = () => navigate("/Attendance/Daily-tracker");

  if (loading) {
    return (
      <FormPageLayout title="Activity" backTo="/Attendance/Daily-tracker">
        <div className="py-12 text-center text-ink-muted">Loading activity...</div>
      </FormPageLayout>
    );
  }

  if (!activity) {
    return (
      <FormPageLayout title="Activity" backTo="/Attendance/Daily-tracker">
        <div className="py-12 text-center text-ink-muted">Activity not found</div>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout title="Activity details" backTo="/Attendance/Daily-tracker" maxWidth="max-w-4xl">
      <Activity activity={activity} onClose={handleClose} />
    </FormPageLayout>
  );
};

export default ActivityDetailPage;
