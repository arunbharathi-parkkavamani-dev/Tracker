import { useState, useEffect } from "react";
import FormRenderer from "../../components/Common/FormRenderer";
import { leaveFormFields, leaveSubmitButton } from "../../constants/leaveForm";
import {
  regularizationFormFields,
  regularizationSubmitButton,
} from "../../constants/regularizationForm";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";

const LeaveAndRegularization = ({ onClose, onSuccess, onFailed }) => {
  const [formType, setFormType] = useState("");
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [liveForm, setLiveForm] = useState({});
  const [availableDays, setAvailableDays] = useState(null);

  // fetch logged-in employee full profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axiosInstance.get(`/populate/read/employees/${user.id}`);
        setUserData(res.data.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user.id]);

  // monitor values in form (FormRenderer sends updates)
  const handleFormChange = (updated) => setLiveForm(updated);

  // fetch available leave balance when leave type changes
  useEffect(() => {
    if (formType !== "leave") return;
    const leaveTypeId = liveForm?.leaveType?._id;
    if (!leaveTypeId) return;

    const fetchAvailable = async () => {
      try {
        const res = await axiosInstance.get(
          `/populate/read/employees/${user.id}?filter=${leaveTypeId}`
        );
        const stats = res?.data?.data?.leaveStatus || [];
        const match = stats.find((l) => l.leaveType === leaveTypeId);
        setAvailableDays(match?.available ?? 0);
      } catch (err) {
        console.error("Failed fetching availability", err);
      }
    };

    fetchAvailable();
  }, [liveForm?.leaveType]);

  // auto calculate totalDays
  useEffect(() => {
    if (formType !== "leave") return;
    const { startDate, endDate } = liveForm;
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return;

    const diff = (end - start) / (1000 * 60 * 60 * 24) + 1;
    setLiveForm((prev) => ({ ...prev, totalDays: diff }));
  }, [liveForm.startDate, liveForm.endDate, formType]);

  // FINAL SUBMIT
  const handleSubmit = async (data) => {
    if (!userData) return;

    // leave workflow
    if (formType === "leave") {
      if (liveForm.totalDays > availableDays) {
        onFailed?.("❌ Insufficient Leave Balance");
        return;
      }

      const leave = data.leaveType;

      const payload = {
        employeeId: userData._id,
        employeeName: userData.basicInfo.firstName,
        departmentId: leave?.departmentId,
        leaveTypeId: leave?.leaveTypeId,
        leaveName: leave?.name,
        managerId: userData.professionalInfo?.reportingManager,
        status: leave?.statusId,
        statusOrderKey: leave?.orderKey,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: liveForm.totalDays,
        reason: data.reason,
      };

      try {
        await axiosInstance.post("/populate/create/leaves", payload);
        onSuccess?.();
        onClose?.();
      } catch (err) {
        onFailed?.(err);
      }
      return;
    }

    // regularization workflow
    try {
      await axiosInstance.post("/populate/create/regularization", data);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      onFailed?.(err);
    }
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={formType ? () => setFormType("") : onClose}
          className="text-gray-500 hover:text-gray-800 text-2xl"
        >
          ×
        </button>
      </div>

      {!formType && (
        <div className="flex gap-4 justify-center my-6">
          <button
            onClick={() => setFormType("leave")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Apply for Leave
          </button>
          <button
            onClick={() => setFormType("regularization")}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            Regularization
          </button>
        </div>
      )}

      {formType === "leave" && userData && (
        <>
          <FormRenderer
            fields={leaveFormFields(userData).map(f =>
              f.name === "availableDays" ? { ...f, externalValue: availableDays } : f
            )}
            submitButton={leaveSubmitButton}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
          />
        </>
      )}

      {formType === "regularization" && (
        <FormRenderer
          fields={regularizationFormFields}
          submitButton={regularizationSubmitButton}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default LeaveAndRegularization;
