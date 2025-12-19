import { useState, useEffect } from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import FloatingCard from "../../components/Common/FloatingCard";
import InlineEdit from "../../components/Common/InLineEdit";
import { updateTaskById } from "./updateTaskById";
import { MdAdd, MdPlayArrow, MdSchedule, MdFlag, MdLabel, MdPersonAdd, MdMoreVert, MdContentCopy, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";

const TaskModal = ({ task, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (task) {
      setFormData(task);
      fetchComments();
      fetchEmployees();
    }
  }, [task]);

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName,basicInfo.lastName');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchComments = async () => {
    if (!task.commentsThread) {
      console.log('No commentsThread found');
      return;
    }
    try {
      const threadId = typeof task.commentsThread === 'object' ? task.commentsThread._id : task.commentsThread;
      if (!threadId) {
        console.log('No valid thread ID');
        return;
      }
      
      const populateFields = {
        "comments.commentedBy": "basicInfo.firstName,basicInfo.lastName"
      };
      const url = `/populate/read/commentsthreads/${threadId}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`;
      
      const response = await axiosInstance.get(url);
      
      // If population didn't work, fetch user details manually
      const commentsWithUsers = await Promise.all(
        (response.data.data?.comments || []).map(async (comment) => {
          if (typeof comment.commentedBy === 'string') {
            try {
              const userResponse = await axiosInstance.get(`/populate/read/employees/${comment.commentedBy}?fields=basicInfo.firstName,basicInfo.lastName`);
              return {
                ...comment,
                commentedBy: userResponse.data.data
              };
            } catch (error) {
              console.error('Error fetching user:', error);
              return comment;
            }
          }
          return comment;
        })
      );
      
      setComments(commentsWithUsers);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    try {
      await updateTaskById(task._id, { [field]: value });
      setFormData(prev => ({ ...prev, [field]: value }));
      toast.success('Task updated successfully');
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error('Failed to update task');
    }
  };

  const handleFollowTask = async () => {
    try {
      const currentFollowers = formData.followers || [];
      const updatedFollowers = [...currentFollowers, user.id];
      await handleFieldUpdate('followers', updatedFollowers);
      toast.success('You are now following this task');
    } catch (error) {
      toast.error('Failed to follow task');
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      const currentAssigned = (formData.assignedTo || []).filter(Boolean);
      const updatedAssigned = [...currentAssigned.map(u => u._id), userId];
      await handleFieldUpdate('assignedTo', updatedAssigned);
    } catch (error) {
      toast.error('Failed to assign user');
    }
  };

  const copyTaskUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Task URL copied to clipboard');
    setShowMoreMenu(false);
  };

  const deleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await updateTaskById(task._id, { status: 'Deleted' });
        toast.success('Task deleted successfully');
        onClose();
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
    setShowMoreMenu(false);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      let threadId = task.commentsThread;
      
      if (!threadId) {
        const threadResponse = await axiosInstance.post('/populate/create/commentsthreads', {
          taskId: task._id,
          comments: []
        });
        threadId = threadResponse.data.data._id;
        
        await axiosInstance.put(`/populate/update/tasks/${task._id}`, {
          commentsThread: threadId
        });
      }

      const finalThreadId = typeof threadId === 'object' ? threadId._id : threadId;
      await axiosInstance.put(`/populate/update/commentsthreads/${finalThreadId}`, {
        $push: {
          comments: {
            commentedBy: user.id,
            message: newComment,
            mentions: []
          }
        }
      });

      setNewComment("");
      fetchComments();
      onUpdate();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'Backlogs': 'bg-gray-500',
    'To Do': 'bg-orange-500',
    'In Progress': 'bg-blue-500',
    'In Review': 'bg-purple-500',
    'Approved': 'bg-green-500',
    'Rejected': 'bg-red-500',
    'Completed': 'bg-green-700'
  };

  return (
    <FloatingCard onClose={onClose}>
      {/* Header - Full Width */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <select
          value={formData.status || ''}
          onChange={(e) => handleFieldUpdate('status', e.target.value)}
          className={`px-3 py-1 rounded text-white text-sm border-none ${statusColors[formData.status] || 'bg-gray-500'}`}
        >
          <option value="Backlogs">Reported (Backlogs)</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
        
        <div className="flex items-center gap-2 flex-1">
          {formData.assignedTo?.filter(Boolean).length > 0 ? (
            formData.assignedTo.filter(Boolean).slice(0, 2).map((assignee, index) => (
              <div
                key={assignee._id || index}
                className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center"
              >
                {assignee.basicInfo?.firstName?.charAt(0) || 'U'}
              </div>
            ))
          ) : (
            <span className="text-gray-500 text-sm">No assignee</span>
          )}
          
          <select
            onChange={(e) => e.target.value && handleAssignUser(e.target.value)}
            className="text-sm border rounded px-2 py-1"
            value=""
          >
            <option value="">Assign to...</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.basicInfo?.firstName} {emp.basicInfo?.lastName}
              </option>
            ))}
          </select>
          
          {formData.createdBy?._id !== user.id && !formData.followers?.includes(user.id) && (
            <button
              onClick={handleFollowTask}
              className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              <MdPersonAdd size={16} />
              Follow
            </button>
          )}
          
          <div className="relative ml-auto">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MdMoreVert size={20} />
            </button>
            
            {showMoreMenu && (
              <div className="absolute right-0 top-8 bg-white border rounded shadow-lg py-1 z-10">
                <button
                  onClick={copyTaskUrl}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left"
                >
                  <MdContentCopy size={16} />
                  Copy URL
                </button>
                <button
                  onClick={deleteTask}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                >
                  <MdDelete size={16} />
                  Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex h-full">
        {/* Main Content */}
        <div className="w-3/4 pr-6">


          {/* Title */}
          <div className="text-2xl font-bold mb-4">
            <InlineEdit
              value={formData.title}
              onSave={(value) => handleFieldUpdate('title', value)}
              canEdit={true}
            />
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
              <div className="text-blue-600">
                <InlineEdit
                  value={formData.category || 'Support request'}
                  onSave={(value) => handleFieldUpdate('category', value)}
                  canEdit={true}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">User story</h3>
              <div className="text-gray-800">
                <InlineEdit
                  value={formData.userStory || 'The bill copy alignment needs to be adjusted slightly lower.'}
                  onSave={(value) => handleFieldUpdate('userStory', value)}
                  canEdit={true}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Observation</h3>
              <div className="text-gray-600">
                <InlineEdit
                  value={formData.observation || '-'}
                  onSave={(value) => handleFieldUpdate('observation', value)}
                  canEdit={true}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Impacts</h3>
              <p className="text-gray-600">-</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Acceptance criteria</h3>
              <div className="text-gray-600">
                <InlineEdit
                  value={formData.acceptanceCreteria || '-'}
                  onSave={(value) => handleFieldUpdate('acceptanceCreteria', value)}
                  canEdit={true}
                />
              </div>
            </div>
          </div>

          {/* Activities and Comments */}
          <div className="mt-8 border-t pt-6">
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded font-medium">Activities</button>
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Comments</button>
            </div>
            
            <div className="space-y-4 mb-4">
              {comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{comment.commentedBy?.basicInfo?.firstName}</span> has created the Task.
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Your thoughts on this..."
                className="flex-1 p-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-1/4 pl-6 border-l">
          <div className="space-y-6">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <MdPlayArrow className="text-green-500" size={20} />
              <span className="font-mono text-lg">00:00:00</span>
            </div>

            {/* Date Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MdSchedule className="text-orange-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Start date</p>
                  <p className="text-sm font-medium">Not set yet</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MdSchedule className="text-orange-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Due on</p>
                  <p className="text-sm font-medium">Not set yet</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MdSchedule className="text-orange-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Reminder</p>
                  <p className="text-sm font-medium">Not set yet *</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MdFlag className="text-orange-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="text-sm font-medium">{formData.priorityLevel || 'None'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MdLabel className="text-blue-500" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Tags</p>
                  <p className="text-sm font-medium">No tags added</p>
                </div>
              </div>
            </div>

            {/* About the Task */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">About the Task</h4>
              <div className="space-y-2 text-sm">
                <p title="Created By" className="cursor-pointer"> {formData.createdBy?.basicInfo?.firstName}</p>
                <p title="Client Name" className="cursor-pointer">{formData.clientId?.name}</p>
                <p title="Category" className="cursor-pointer">{formData.projectTypeId?.name}</p>
                <p title="Created At" className="cursor-pointer"> {new Date(formData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingCard>
  );
};

export default TaskModal;