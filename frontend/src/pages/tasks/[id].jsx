import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import TaskModal from "./TaskModal";
import FloatingCard from "../../components/Common/FloatingCard";
import { useAuth } from "../../context/authProvider.jsx";
import ShareButton from "../../utils/Sharebutton.jsx";

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if this is direct URL access (not from modal)
  const isDirectAccess = !location.state?.fromModal && !location.state?.fromNotification;

  useEffect(() => {
    // If direct access, navigate to dashboard first, then show modal
    if (isDirectAccess) {
      navigate('/dashboard', { 
        replace: true, 
        state: { showTaskModal: true, taskId: id }
      });
    }
  }, [isDirectAccess, navigate, id]);

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
    if (isDirectAccess) {
      navigate('/dashboard'); // Go to dashboard for direct access
    } else {
      navigate(-1); // Go back for modal access
    }
  };

  const handleUpdate = () => {
    if (isDirectAccess) {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
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

  // For direct access, don't render anything - let dashboard handle it
  if (isDirectAccess) {
    return null;
  }

  // Always show FloatingCard - no background content needed
  return (
    <FloatingCard onClose={handleClose}>
      <div className="relative">
        {isDirectAccess && (
          <div className="absolute top-2 right-2 z-10">
            <ShareButton model="tasks" id={id} />
          </div>
        )}
        <TaskModal
          task={task}
          onClose={handleClose}
          onUpdate={handleUpdate}
        />
      </div>
    </FloatingCard>
  );
};

export default TaskDetailPage;