import {useState, useEffect} from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";

const LeaveAndRegularization = ({ onClose }) => {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formDate, setFormDate] = useState("");
    const [selectedLeaveType, setSelectedLeaveType] = useState("");
    const [usedLeaves, setUsedLeaves] = useState([]);
    // Fetch user data
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

    // Fetch leave types
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                const res = await axiosInstance.post(`/populate/read/employees/${user.id}`, {
                    params: {
                        aggregate: true,
                        stages: [
                            { $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "departmentDetails" } },
                            { $unwind: "$departmentDetails" },
                            { $lookup: { from: "leavePolicies", localField: "departmentDetails.leavePolicy", foreignField: "_id", as: "leavePolicyDetails" } },
                            { $unwind: "$leavePolicyDetails" },
                            { $project: { leaveTypes: "$leavePolicyDetails.leaveTypes" } },
                        ]
                    }
                });

                const result = res.data?.data || [];
                console.log(result, "Result Updated")
                const leaveTypes = Array.isArray(result) && result.length > 0 ? result[0].leaveTypes : [];
                setLeaveTypes(leaveTypes);
            } catch (error) {
                console.error("Error fetching leave types:", error);
            }
        };
        fetchLeaveTypes();
    }, [user.id]);

    // Fetch pending leaves
    useEffect(() => {
        const fetchUsedLeaves = async () => {
            try {
                const res = await axiosInstance.get(`/populate/read/leave/?employee=${user.id}&leaveType=${selectedLeaveType}`);
                const result = res.data?.data || [];
                if (Array.isArray(result) && result.length > 0) {
                    setUsedLeaves(result.length);
                } else {
                    setUsedLeaves(0);
                }
            } catch (error) {
                console.error("Error fetching Used leaves:", error);
            }
        };
        fetchUsedLeaves();
    }, [user.id, selectedLeaveType]);

    const findBalanceLeaves = () => {
        if (!userData || !userData.leaveBalance) return 0;
        const balance = userData.leaveBalance.find(lb => lb.leaveType === selectedLeaveType);
        return balance ? balance.balance : 0;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Apply for Leave / Regularization</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <select
                        value={selectedLeaveType}
                        onChange={(e) => setSelectedLeaveType(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                    >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map((leaveType) => (
                            <option key={leaveType.id} value={leaveType.id}>
                                {leaveType.name}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">Available Balance: {findBalanceLeaves()} days</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Used Leaves</label>
                    <p className="mt-1 text-sm text-gray-600">{usedLeaves} days</p>
                </div>
            </form>
        </div>
    );  
};

export default LeaveAndRegularization;