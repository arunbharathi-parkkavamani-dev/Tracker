import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import FormPageLayout from "../../components/Forms/FormPageLayout";
import InlineEdit from "../../components/Common/InLineEdit";
import { useAuth } from "../../context/authProvider";
import { ExternalLink, UserPlus, Check, MessageSquare, Clock, Flag, Tag, CalendarDays, ChevronDown, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CLS = {
  "Backlogs": "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  "To Do": "bg-surface-2 text-ink-muted",
  "In Progress": "bg-[var(--tracker-info-light)] text-[var(--tracker-info)]",
  "In Review": "bg-[#F3E8FF] text-[#6B21A8]",
  "Approved": "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
  "Rejected": "bg-[var(--tracker-danger-light)] text-[var(--tracker-danger)]",
  "Completed": "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
};

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const assignRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchEmployees();
    }
    const handler = (e) => {
      if (assignRef.current && !assignRef.current.contains(e.target)) setShowAssignDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const populateFields = {
        clientId: "name",
        projectTypeId: "name",
        taskTypeId: "name",
        createdBy: "basicInfo.firstName,basicInfo.lastName",
        assignedTo: "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
        linkedTicketId: "ticketId,title",
      };
      const res = await axiosInstance.post(`/populate/read/tasks/${id}`, {
        populateFields
      });
      const taskData = res.data.data;
      setTask(taskData);
      if (taskData.commentsThread) fetchComments(taskData.commentsThread);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.post("/populate/read/employees", {
        fields: "basicInfo.firstName,basicInfo.lastName",
      });
      setEmployees(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchComments = async (thread) => {
    const threadId = typeof thread === "object" ? thread._id : thread;
    if (!threadId) return;
    try {
      const populateFields = { "comments.commentedBy": "basicInfo.firstName,basicInfo.lastName" };
      const res = await axiosInstance.post(`/populate/read/commentsthreads/${threadId}`, {
        populateFields
      });
      setComments(res.data.data?.comments || []);
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (field, value) => {
    try {
      await axiosInstance.put(`/populate/update/tasks/${id}`, { [field]: value });
      setTask((prev) => ({ ...prev, [field]: value }));
      toast.success("Updated");
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    }
  };

  const handleAssignUser = async (empId) => {
    const current = task.assignedTo || [];
    if (current.some((a) => (a._id || a) === empId)) return;
    const updated = [...current.map((a) => a._id || a), empId];
    await handleUpdate("assignedTo", updated);
    fetchTask();
  };

  const handleUnassignUser = async (empId) => {
    const updated = (task.assignedTo || [])
      .map((a) => a._id || a)
      .filter((a) => a !== empId);
    await handleUpdate("assignedTo", updated);
    fetchTask();
  };

  const addComment = async () => {
    if (!newComment.trim() || !task.commentsThread) return;
    setSubmitting(true);
    try {
      const threadId = typeof task.commentsThread === "object" ? task.commentsThread._id : task.commentsThread;
      await axiosInstance.put(`/populate/update/commentsthreads/${threadId}`, {
        $push: { comments: { commentedBy: user.id, message: newComment, mentions: [] } },
      });
      setNewComment("");
      fetchComments(task.commentsThread);
      toast.success("Comment added");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const isAssigned = (empId) =>
    (task.assignedTo || []).some((a) => (a._id || a) === empId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-muted">
        Task not found
      </div>
    );
  }

  const cardCls = "tracker-card-plain p-4 sm:p-6";

  return (
    <div data-module="project">
      <FormPageLayout title={task.title || "Task"} backTo="/tasks" embedded maxWidth="max-w-6xl">
        <div className="bg-surface rounded-tracker-card border border-hairline shadow-sm">

          {/* ── Header: status + assign + view ticket ── */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline-soft">
            <select
              value={task.status || ""}
              onChange={(e) => handleUpdate("status", e.target.value)}
              className={`px-2.5 py-1 rounded-tracker-md text-xs sm:text-sm font-semibold border-0 cursor-pointer outline-none ${STATUS_CLS[task.status] || "bg-surface-2 text-ink-muted"}`}
            >
              <option value="Backlogs">Reported (Backlogs)</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="relative" ref={assignRef}>
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="tracker-btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">{task.assignedTo?.filter(Boolean).length || 0} Assigned</span>
                <span className="sm:hidden">{task.assignedTo?.filter(Boolean).length || 0}</span>
              </button>
              {showAssignDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-surface border border-hairline rounded-tracker-card shadow-lg py-1 z-20 min-w-48 sm:min-w-56 max-h-64 overflow-y-auto">
                  {employees.map((emp) => {
                    const assigned = isAssigned(emp._id);
                    return (
                      <div
                        key={emp._id}
                        onClick={() => assigned ? handleUnassignUser(emp._id) : handleAssignUser(emp._id)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-surface-1 cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="text-ink">{emp.basicInfo?.firstName} {emp.basicInfo?.lastName}</span>
                        {assigned && <Check size={13} className="text-[var(--tracker-success)]" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {task.linkedTicketId && (
              <button
                onClick={() => navigate(`/Tickets/${task.linkedTicketId._id || task.linkedTicketId}`)}
                className="ml-auto tracker-btn-accent inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm"
              >
                <ArrowUpRight size={13} />
                <span>Ticket</span>
              </button>
            )}
          </div>

          {/* ── Body: two-column responsive ── */}
          <div className="flex flex-col lg:flex-row">

            {/* ── Left: Content ── */}
            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 border-b lg:border-b-0 lg:border-r border-hairline-soft">
              <div className="text-lg sm:text-xl font-bold text-ink mb-4 sm:mb-6">
                <InlineEdit value={task.title} onSave={(v) => handleUpdate("title", v)} canEdit />
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">User Story</h3>
                  <div className="text-sm text-ink">
                    <InlineEdit value={task.userStory || ""} onSave={(v) => handleUpdate("userStory", v)} canEdit />
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">Observation</h3>
                  <div className="text-sm text-ink">
                    <InlineEdit value={task.observation || "-"} onSave={(v) => handleUpdate("observation", v)} canEdit />
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">Acceptance Criteria</h3>
                  <div className="text-sm text-ink">
                    <InlineEdit value={task.acceptanceCreteria || "-"} onSave={(v) => handleUpdate("acceptanceCreteria", v)} canEdit />
                  </div>
                </div>
              </div>

              {/* ── Comments ── */}
              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-hairline-soft">
                <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                  <MessageSquare size={14} /> Comments ({comments.length})
                </h3>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {comments.length === 0 && (
                    <p className="text-sm text-ink-subtle text-center py-4">No comments yet</p>
                  )}
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--module-accent-light)] flex items-center justify-center text-[var(--module-accent)] text-xs font-bold flex-shrink-0">
                        {c.commentedBy?.basicInfo?.firstName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">
                            {c.commentedBy?.basicInfo?.firstName} {c.commentedBy?.basicInfo?.lastName || "Unknown"}
                          </span>
                          <span className="text-xs text-ink-subtle">
                            {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-sm text-ink mt-0.5">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !submitting && addComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-3.5 py-2.5 text-sm bg-surface border border-hairline rounded-tracker-md text-ink placeholder:text-ink-subtle outline-none focus:border-[var(--tracker-border-focus)] transition-colors"
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || submitting}
                    className="tracker-btn-accent px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Details sidebar ── */}
            <div className="w-full lg:w-72 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-4 sm:mb-5">Details</h3>

              <div className="space-y-5 sm:space-y-6">
                {/* Priority */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Flag size={13} className="text-[var(--tracker-warning)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Priority</span>
                  </div>
                  <select
                    value={task.priorityLevel || "None"}
                    onChange={(e) => handleUpdate("priorityLevel", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-hairline rounded-tracker-md text-ink outline-none focus:border-[var(--tracker-border-focus)] transition-colors cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-[var(--module-accent)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Category</span>
                  </div>
                  <div className="text-sm text-ink font-medium">
                    <InlineEdit value={task.projectTypeId?.name || "Support request"} onSave={(v) => handleUpdate("category", v)} canEdit />
                  </div>
                </div>

                {/* Task Type */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-[var(--module-accent)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Task Type</span>
                  </div>
                  <div className="text-sm text-ink">
                    {task.taskTypeId?.name || "-"}
                  </div>
                </div>

                {/* Assigned */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus size={13} className="text-ink-subtle" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Assigned</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {task.assignedTo?.filter(Boolean).length > 0 ? task.assignedTo.filter(Boolean).map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[var(--module-accent-light)] text-[var(--module-accent)]">
                        {a.basicInfo?.firstName || "Unknown"}
                      </span>
                    )) : (
                      <span className="text-ink-subtle text-sm">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* ETA */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays size={13} className="text-ink-subtle" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">ETA</span>
                  </div>
                  <input
                    type="date"
                    value={task.endDate ? task.endDate.split("T")[0] : ""}
                    onChange={(e) => handleUpdate("endDate", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-hairline rounded-tracker-md text-ink outline-none focus:border-[var(--tracker-border-focus)] transition-colors"
                  />
                </div>

                {/* Start date */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} className="text-ink-subtle" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Start date</span>
                  </div>
                  <div className="text-sm text-ink">{task.startDate ? new Date(task.startDate).toLocaleDateString() : "Not set"}</div>
                </div>

                <div className="pt-3 border-t border-hairline-soft">
                  <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">About</h4>
                  <div className="space-y-2.5 text-sm">
                    <div>
                      <span className="text-ink-subtle text-xs block">Created By</span>
                      <span className="text-ink">{task.createdBy?.basicInfo?.firstName} {task.createdBy?.basicInfo?.lastName || ""}</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle text-xs block">Client</span>
                      <span className="text-ink">{task.clientId?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle text-xs block">Created</span>
                      <span className="text-ink">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormPageLayout>
    </div>
  );
};

export default TaskDetailPage;
