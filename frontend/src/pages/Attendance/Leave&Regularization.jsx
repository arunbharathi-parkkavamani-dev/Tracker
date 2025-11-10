import { useState, useEffect } from "react";
import FormRenderer from "../../components/Common/FormRenderer";
import { leaveFormFields, leaveSubmitButton } from "../../constants/leaveForm";
import {
  regularizationFormFields,
  regularizationSubmitButton,
} from "../../constants/regularizationForm";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";

const LeaveAndRegularization = ({ onClose }) => {
  const [formType, setFormType] = useState("");
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);

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

  // Fetch leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await axiosInstance.post(
          `/populate/read/employees/${user.id}`,
          { params: { aggregate: true,
              stages: [
                { $lookup: { from: "departments", localField: "professionalInfo.department", foreignField: "_id", as: "departmentDetails",},},
                { $unwind: "$departmentDetails" },
                { $lookup: { from: "leavepolicies", localField: "departmentDetails.leavePolicy", foreignField: "_id", as: "leavePolicyDetails",},},
                { $unwind: "$leavePolicyDetails" },
                { $unwind: "$leavePolicyDetails.leaves" },
                { $lookup: { from: "leavetypes", localField: "leavePolicyDetails.leaves.leaveType", foreignField: "_id", as: "leaveTypeInfo",},},
                { $unwind: "$leaveTypeInfo" },
                { $project: { _id: 1, departmentName: "$departmentDetails.name", departmentId: "$departmentDetails._id", leaveTypeId: "$leaveTypeInfo._id", leaveName: "$leaveTypeInfo.name",},},
              ],
            },
          }
        );

        const result = res.data?.data || [];
        const formatted = result.map((lt) => ({
          label: lt.leaveName,
          value: lt.leaveTypeId,
        }));
        setLeaveTypes(formatted);
      } catch (error) {
        console.error("Error fetching leave types:", error);
      }
    };
    fetchLeaveTypes();
  }, [user.id]);

  const handleSubmit = async (data) => {
    console.log("Form submitted:", data);
    // You can combine userData + data before posting
    const payload = {
      employeeId: userData._id,
      departmentID: userData.departmentName,
      ...data,
    };
    try {
      const res = await axiosInstance.post("/populate/create/leave", payload);
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {formType === "leave" && (
            <FormRenderer
              fields={leaveFormFields.map((f) =>
                f.name === "employeeId"
                  ? { ...f, value: userData?._id } // dynamically inject
                  : f.name === "departmentId"
                  ? { ...f, value: userData?.professionalInfo?.department }
                  : f.name === "managerId"
                  ? { ...f, value: userData?.professionalInfo?.reportingManager }
                  : f
              )}
              submitButton={leaveSubmitButton}
              onSubmit={handleSubmit}
              dynamicOptions={{ leaveTypes }}
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

      {formType === "leave" && (
        <FormRenderer
          fields={leaveFormFields}
          submitButton={leaveSubmitButton}
          onSubmit={handleSubmit}
          dynamicOptions={{ leaveTypes }} // 👈 dynamically passed options
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
  );
};

export default LeaveAndRegularization;
