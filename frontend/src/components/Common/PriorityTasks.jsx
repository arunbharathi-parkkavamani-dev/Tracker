import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/authProvider";

export default function PriorityTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const fetchPriorityTasks = async () => {
      try {
        const filter = {
          assignedTo: user._id,
          status: { $ne: "Completed" }
        };

        const res = await axiosInstance.get(
          `/populate/read/tasks?filter=${encodeURIComponent(
            JSON.stringify(filter)
          )}&limit=5&sort={"dueDate":1}`
        );

        setTasks(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch priority tasks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorityTasks();
  }, [user]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Priority Tasks</h3>
        <button className="text-sm text-blue-600 hover:underline">
          View all
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400">
          No priority tasks 🎉
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id}>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-gray-500">
                {task.status} •{" "}
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}