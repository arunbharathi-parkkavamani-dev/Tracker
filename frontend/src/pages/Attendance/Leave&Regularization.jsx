  import { useState, useEffect } from "react";
  import FormRenderer from "../../components/Common/FormRenderer";
  import { leaveFormFields, leaveSubmitButton } from "../../constants/leaveForm";
  import {
    regularizationFormFields,
    regularizationSubmitButton,
  } from "../../constants/regularizationForm";
  import axiosInstance from "../../api/axiosInstance";
  import { useAuth } from "../../context/authProvider";

  const LeaveAndRegularization = ({ onClose, onSuccess, onFailed  }) => {
    const [formType, setFormType] = useState("");
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);

    // Fetch user data
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const res = await axiosInstance.get(
            `/populate/read/employees/${user.id}`
          );
          setUserData(res.data.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }, [user.id]);

    const handleSubmit = async (data) => {
      // You can combine userData + data before posting
      if (!userData) {
            console.error("User data not loaded");
                return;
                }
      const payload = {
        status : "69121b1cd664e361c6738b1f",
        employeeId: userData._id,
        departmentID: userData.departmentName,
        ...data,
      };
      try {
        await axiosInstance.post("/populate/create/leave", payload);

        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } catch (err) {
        console.log(err);
        if (onFailed) onFailed();
      }
    };

    return (
      <div className="p-6 text-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {formType === "leave" && userData && (
              <FormRenderer
                fields={leaveFormFields(userData).map((f) =>
                  f.name === "employeeId"
                    ? { ...f, value: userData._id }
                    : f.name === "departmentId"
                    ? { ...f, value: userData.professionalInfo?.department }
                    : f.name === "managerId"
                    ? { ...f, value: userData.professionalInfo?.reportingManager }
                    : f
                )}
                submitButton={leaveSubmitButton}
                onSubmit={handleSubmit}
              />
            )}
          </h2>
          <button
            onClick={formType ? () => setFormType("") : onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            &times;
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
