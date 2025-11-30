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
    <div className="p-8">
      {!formType ? (
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Leave & Regularization
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Choose the type of request you'd like to submit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => setFormType("leave")}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700 p-8 rounded-2xl border border-blue-200 dark:border-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">Apply for Leave</h3>
              <p className="text-blue-600 dark:text-blue-300 text-sm">Submit a leave request for vacation, sick days, or personal time</p>
            </button>
            
            <button
              onClick={() => setFormType("regularization")}
              className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800 dark:hover:to-green-700 p-8 rounded-2xl border border-green-200 dark:border-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Regularization</h3>
              <p className="text-green-600 dark:text-green-300 text-sm">Request attendance regularization for missed check-ins or check-outs</p>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-8">
            <button
              onClick={() => setFormType("")}
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {formType === "leave" ? "Leave Application" : "Attendance Regularization"}
            </h2>
          </div>
          
          {formType === "leave" && userData && (
            <FormRenderer
              fields={leaveFormFields(userData).map(f =>
                f.name === "availableDays" ? { ...f, externalValue: availableDays } : f
              )}
              submitButton={leaveSubmitButton}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
            />
          )}

          {formType === "regularization" && (
            <FormRenderer
              fields={regularizationFormFields}
              submitButton={regularizationSubmitButton}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveAndRegularization;
