import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import TaskModal from "./TaskModal";
import FloatingCard from "../../components/Common/FloatingCard";

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const populateFields = {
          'clientId': 'name',
          'projectTypeId': 'name',
          'taskTypeId': 'name',
          'createdBy': 'basicInfo.firstName,basicInfo.lastName',
          'assignedTo': 'basicInfo.firstName,basicInfo.lastName'
        };
        
        const response = await axiosInstance.get(
          `/populate/read/tasks/${id}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
        );
        
        setTask(response.data.data);
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id]);

  const handleClose = () => {
    navigate('/tasks');
  };

  const handleUpdate = () => {
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Task not found</div>
      </div>
    );
  }

  const location = useLocation();
  const isDirectNavigation = location.pathname.includes('/tasks/');

  if (isDirectNavigation) {
    // Direct navigation - show as floating card
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <FloatingCard onClose={handleClose}>
          <TaskModal
            task={task}
            onClose={handleClose}
            onUpdate={handleUpdate}
          />
        </FloatingCard>
      </div>
    );
  }

  // Modal mode - return just the TaskModal
  return (
    <TaskModal
      task={task}
      onClose={handleClose}
      onUpdate={handleUpdate}
    />
  );
};

export default TaskDetailPage;