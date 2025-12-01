import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeaveAndRegularization from "../Attendance/Leave&Regularization";
import FloatingCard from "../../components/Common/FloatingCard";

const LeaveRegularizationPage = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleError = (error) => {
    setErrorMessage(error?.response?.data?.message || error?.message || "An error occurred");
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  };

  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/attendance');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Request submitted successfully!
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {errorMessage}
        </div>
      )}

      <FloatingCard onClose={handleClose}>
        <LeaveAndRegularization 
          onClose={handleClose}
          onSuccess={handleSuccess}
          onFailed={handleError}
        />
      </FloatingCard>
    </div>
  );
};

export default LeaveRegularizationPage;