import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import FormPageLayout from "../../components/Forms/FormPageLayout";
import InlineEdit from "../../components/Common/InLineEdit";
import { useAuth } from "../../context/authProvider";
import { ExternalLink, UserPlus, Check, MessageSquare, Clock, Flag, Tag, CalendarDays, ChevronDown, ArrowUpRight, Plus, LayoutGrid, X } from "lucide-react";
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
    <div data-module="project" className="bg-white min-h-screen pt-3 px-3 sm:px-6 pb-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ── Top Bar (Tabs & Actions) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e2e8f0] pb-2 mb-4 gap-3">
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#7c3aed] border-b-2 border-[#7c3aed] pb-2 -mb-[9px]">
              <Tag size={13} /> Details
            </button>
            <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#64748b] pb-2 -mb-[9px] hover:text-[#334155]">
              <CalendarDays size={13} /> Gantt Chart
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown disguised as badge */}
            <select
              value={task.status || ""}
              onChange={(e) => handleUpdate("status", e.target.value)}
              className="appearance-none bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-bold text-[11px] px-2 py-1 rounded cursor-pointer outline-none"
            >
              <option value="Backlogs">Backlogs</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Approved">✅ DEV</option>
              <option value="Completed">Completed</option>
            </select>

            <button className="text-[#3b82f6] p-1 rounded border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] transition-colors">
              <MessageSquare size={14} />
            </button>

            <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors shadow-sm">
              <Plus size={12} /> Create Sub-Task
            </button>

            {task.clientId && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] font-bold text-[11px] px-2.5 py-1 rounded flex items-center gap-1">
                <LayoutGrid size={12} className="text-[#8b5cf6]" /> 
                Board: {task.clientId.name?.substring(0,4).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          
          {/* ── Left: Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-[17px] font-extrabold text-[#0f172a] mb-2.5 tracking-tight leading-snug">
              <InlineEdit value={task.title} onSave={(v) => handleUpdate("title", v)} canEdit />
            </h1>

            {/* Description / User Story rendered as plain text for density */}
            <div className="text-[12.5px] leading-relaxed text-[#334155] whitespace-pre-wrap mb-5">
              {task.userStory || "No description provided."}
            </div>

            {/* Ticket Context Box */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-md p-3 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-[12px] font-bold text-[#1e293b]">
                    <Tag size={13} className="text-[#3b82f6]" /> Ticket Context
                  </div>
                  {task.linkedTicketId && (
                    <span className="bg-[#eff6ff] text-[#3b82f6] text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#dbeafe] flex items-center gap-0.5">
                      {task.linkedTicketId.ticketId || task.linkedTicketId._id?.substring(0,8)} <ExternalLink size={9} />
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <span className="bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold px-2 py-0.5 rounded flex items-center">
                    Bug
                  </span>
                  <span className="bg-[#fff7ed] text-[#ea580c] text-[10px] font-bold px-2 py-0.5 rounded">
                    Priority: {task.priorityLevel || "High"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Observation */}
                <div>
                  <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Observation</h3>
                  <div className="bg-white border border-[#e2e8f0] rounded text-[11.5px] text-[#334155] p-2 shadow-sm min-h-[40px]">
                    <InlineEdit value={task.observation || "-"} onSave={(v) => handleUpdate("observation", v)} canEdit />
                  </div>
                </div>

                {/* Acceptance Criteria */}
                <div>
                  <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Acceptance Criteria</h3>
                  <div className="bg-white border border-[#e2e8f0] rounded text-[11.5px] text-[#334155] p-2 shadow-sm min-h-[40px]">
                    <InlineEdit value={task.acceptanceCreteria || "-"} onSave={(v) => handleUpdate("acceptanceCreteria", v)} canEdit />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Comments Section ── */}
            <div className="pt-4">
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-3 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#94a3b8]" /> Discussion ({comments.length})
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !submitting && addComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-2.5 py-1.5 text-[12px] border border-[#cbd5e1] rounded text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:border-[#3b82f6] shadow-sm"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim() || submitting}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-3 py-1.5 rounded text-[12px] shadow-sm disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              </div>
              <div className="space-y-3">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center text-[#475569] font-bold text-[10px] flex-shrink-0">
                      {c.commentedBy?.basicInfo?.firstName?.charAt(0) || "U"}
                    </div>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-2 flex-1 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11.5px] font-bold text-[#1e293b]">
                          {c.commentedBy?.basicInfo?.firstName} {c.commentedBy?.basicInfo?.lastName}
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#334155] leading-snug">{c.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: Sidebar ── */}
          <div className="w-full lg:w-[240px] flex-shrink-0">
            <div className="bg-white border-l border-[#e2e8f0] pl-5 h-full space-y-4 pb-20">
              
              {/* Assignee */}
              <div>
                <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 flex items-center gap-1">
                  Assignee <span className="text-[#f59e0b]">🔒</span>
                </label>
                <div className="border border-[#e2e8f0] rounded p-1.5 flex items-center justify-between cursor-pointer hover:border-[#cbd5e1] transition-colors relative" ref={assignRef}>
                  <div className="flex items-center gap-1.5" onClick={() => setShowAssignDropdown(!showAssignDropdown)}>
                    {task.assignedTo?.[0] ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-[#cbd5e1] flex items-center justify-center text-[9px] font-bold text-white">
                          {task.assignedTo[0].basicInfo?.firstName?.charAt(0)}
                        </div>
                        <span className="text-[11.5px] font-semibold text-[#334155]">
                          {task.assignedTo[0].basicInfo?.firstName}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11.5px] font-medium text-[#94a3b8]">Select</span>
                    )}
                  </div>
                  <ChevronDown size={12} className="text-[#94a3b8] cursor-pointer" onClick={() => setShowAssignDropdown(!showAssignDropdown)} />
                  
                  {showAssignDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
                      {employees.map((emp) => {
                        const assigned = isAssigned(emp._id);
                        return (
                          <div
                            key={emp._id}
                            onClick={() => assigned ? handleUnassignUser(emp._id) : handleAssignUser(emp._id)}
                            className="flex items-center justify-between px-2 py-1.5 hover:bg-[#f8fafc] cursor-pointer text-[11.5px]"
                          >
                            <span className="text-[#334155] truncate">{emp.basicInfo?.firstName}</span>
                            {assigned && <Check size={12} className="text-[#10b981]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Followers */}
              <div>
                <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 block">
                  Add Followers
                </label>
                <div className="border border-[#e2e8f0] rounded p-1 flex flex-wrap gap-1 mb-1">
                  {task.assignedTo?.length > 1 && task.assignedTo.slice(1).map((f, i) => (
                    <div key={i} className="bg-[#eff6ff] text-[#3b82f6] text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#bfdbfe] text-[#1d4ed8] flex items-center justify-center text-[8px]">
                        {f.basicInfo?.firstName?.charAt(0)}
                      </div>
                      {f.basicInfo?.firstName?.substring(0, 6)}
                      <X size={10} className="cursor-pointer hover:text-[#1d4ed8]" onClick={() => handleUnassignUser(f._id)} />
                    </div>
                  ))}
                  <div className="flex-1 min-w-[50px] flex items-center justify-end px-1">
                    <ChevronDown size={12} className="text-[#94a3b8]" />
                  </div>
                </div>
                <div className="text-[10px] font-bold text-[#3b82f6] flex items-center gap-1 cursor-pointer">
                  <UserPlus size={10} /> View {Math.max(0, (task.assignedTo?.length || 0) - 1)}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 block">
                  Due Date <span className="text-[#ef4444]">*</span>
                </label>
                <div className={`relative ${!task.endDate ? "border-[#ef4444]" : "border-[#e2e8f0]"} border rounded`}>
                  <input
                    type="date"
                    value={task.endDate ? task.endDate.split("T")[0] : ""}
                    onChange={(e) => handleUpdate("endDate", e.target.value)}
                    className="w-full pl-2 pr-6 py-1 text-[11.5px] font-semibold text-[#334155] rounded outline-none"
                  />
                  <CalendarDays size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                </div>
              </div>

              {/* Weightage */}
              <div>
                <label className="text-[10px] font-bold text-[#cbd5e1] uppercase tracking-wider mb-1 flex items-center gap-1">
                  Weightage <span className="text-[#cbd5e1]">🔒</span>
                </label>
                <div className="border border-[#f1f5f9] bg-[#f8fafc] rounded p-1.5 flex items-center justify-between text-[#cbd5e1]">
                  <span className="text-[11.5px] font-medium">Select</span>
                  <ChevronDown size={12} />
                </div>
              </div>

              {/* Meta Info */}
              <div className="pt-1 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 block">
                    Created By
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center text-[8px] font-bold border border-[#e2e8f0]">
                      {task.createdBy?.basicInfo?.firstName?.charAt(0) || "U"}
                    </div>
                    <span className="text-[11.5px] font-bold text-[#1e293b]">
                      {task.createdBy?.basicInfo?.firstName}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 block">
                    Handover
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center text-[8px] font-bold border border-[#fef3c7]">
                      RJ
                    </div>
                    <span className="text-[11.5px] font-bold text-[#1e293b]">
                      Rahul J
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
