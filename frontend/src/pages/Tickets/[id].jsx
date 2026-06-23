import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import FormPageLayout from "../../components/Forms/FormPageLayout";
import InlineEdit from "../../components/Common/InLineEdit";
import { useAuth } from "../../context/authProvider";
import { MessageSquare, ExternalLink, UserPlus, Check, Flag, Tag, CalendarDays, Clock, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CLS = {
  "Open": "bg-[var(--tracker-info-light)] text-[var(--tracker-info)]",
  "In Progress": "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  "Review": "bg-[var(--module-hr-light)] text-[var(--module-hr)]",
  "Testing": "bg-[var(--brand-teal-light)] text-[var(--brand-teal)]",
  "Completed": "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
  "Closed": "bg-surface-2 text-ink-muted",
};

const PRIORITY_CLS = {
  Critical: "bg-[var(--tracker-danger-light)] text-[var(--tracker-danger)]",
  High: "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  Medium: "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  Low: "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("public");
  const assignRef = useRef(null);

  useEffect(() => {
    if (id) fetchTicket();
    fetchEmployees();
    const handler = (e) => {
      if (assignRef.current && !assignRef.current.contains(e.target)) setShowAssignDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const populateFields = {
        'clientId': 'name',
        'type': 'name',
        'createdBy': 'basicInfo.firstName,basicInfo.lastName',
        'assignedTo': 'basicInfo.firstName,basicInfo.lastName',
        'comments.commentedBy': 'basicInfo.firstName,basicInfo.lastName',
        'linkedTaskId': 'title,status',
      };
      const res = await axiosInstance.get(
        `/populate/read/tickets/${id}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      setTicket(res.data.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load ticket");
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (field, value) => {
    try {
      await axiosInstance.put(`/populate/update/tickets/${id}`, { [field]: value });
      setTicket((prev) => ({ ...prev, [field]: value }));
      toast.success("Updated");
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    }
  };

  const handleAssignUser = async (empId) => {
    const current = ticket.assignedTo || [];
    if (current.some((a) => (a._id || a) === empId)) return;
    const updated = [...current.map((a) => a._id || a), empId];
    await handleUpdate("assignedTo", updated);
    fetchTicket();
  };

  const handleUnassignUser = async (empId) => {
    const updated = (ticket.assignedTo || [])
      .map((a) => a._id || a)
      .filter((a) => a !== empId);
    await handleUpdate("assignedTo", updated);
    fetchTicket();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = {
        comment: newComment,
        commentedBy: user.id,
        isPublic: commentType === "public",
        commentedAt: new Date(),
      };
      await axiosInstance.put(`/populate/update/tickets/${id}`, {
        $push: { comments: comment },
      });
      setNewComment("");
      fetchTicket();
      toast.success("Comment added");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add comment");
    }
  };

  const isAssigned = (empId) =>
    (ticket.assignedTo || []).some((a) => (a._id || a) === empId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-ticket)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-muted">
        Ticket not found
      </div>
    );
  }

  const publicComments = (ticket.comments || []).filter((c) => c.isPublic !== false);
  const internalComments = (ticket.comments || []).filter((c) => c.isPublic === false);

  return (
    <div data-module="ticket">
      <FormPageLayout title="Ticket" backTo="/Tickets" embedded maxWidth="max-w-6xl">
        <div className="bg-surface rounded-tracker-card border border-hairline shadow-sm">

          {/* ── Header: status + assign + linked task ── */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline-soft">
            <select
              value={ticket.status || "Open"}
              onChange={(e) => handleUpdate("status", e.target.value)}
              className={`px-2.5 py-1 rounded-tracker-md text-xs sm:text-sm font-semibold border-0 cursor-pointer outline-none ${STATUS_CLS[ticket.status] || "bg-surface-2 text-ink-muted"}`}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Testing">Testing</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>

            <div className="relative" ref={assignRef}>
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="tracker-btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm"
              >
                <UserPlus size={13} />
                <span className="hidden sm:inline">{ticket.assignedTo?.filter(Boolean).length || 0} Assigned</span>
                <span className="sm:hidden">{ticket.assignedTo?.filter(Boolean).length || 0}</span>
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

            <div className="ml-auto flex items-center gap-2">
              {ticket.linkedTaskId && (
                <button
                  onClick={() => {
                    const taskId = typeof ticket.linkedTaskId === "object"
                      ? ticket.linkedTaskId._id : ticket.linkedTaskId;
                    navigate(`/tasks/${taskId}`);
                  }}
                  className="tracker-btn-accent inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm"
                >
                  <ArrowUpRight size={13} />
                  <span>Task</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Body: two-column responsive ── */}
          <div className="flex flex-col lg:flex-row">

            {/* ── Left: Main content ── */}
            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 border-b lg:border-b-0 lg:border-r border-hairline-soft">
              <div className="text-xs text-ink-subtle mb-1">{ticket.ticketId}</div>
              <div className="text-lg sm:text-xl font-bold text-ink mb-4 sm:mb-6">
                <InlineEdit
                  value={ticket.title}
                  onSave={(v) => handleUpdate("title", v)}
                  canEdit
                />
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">User Story</h3>
                  <div className="text-sm text-ink">
                    <InlineEdit
                      value={ticket.userStory}
                      onSave={(v) => handleUpdate("userStory", v)}
                      canEdit
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1.5">Description</h3>
                  <div className="text-sm text-ink">
                    <InlineEdit
                      value={ticket.description}
                      onSave={(v) => handleUpdate("description", v)}
                      canEdit
                    />
                  </div>
                </div>

                {(ticket.impactAnalysis || ticket.acceptanceCriteria || ticket.url) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {ticket.impactAnalysis && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1">Impact Analysis</h3>
                        <p className="text-sm text-ink">{ticket.impactAnalysis}</p>
                      </div>
                    )}
                    {ticket.acceptanceCriteria && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1">Acceptance Criteria</h3>
                        <p className="text-sm text-ink">{ticket.acceptanceCriteria}</p>
                      </div>
                    )}
                    {ticket.url && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-1">URL</h3>
                        <a href={ticket.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--module-ticket)] hover:underline">{ticket.url}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Comments ── */}
              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-hairline-soft">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setCommentType("public")}
                    className={`px-3 py-1.5 rounded-tracker-md text-xs sm:text-sm font-medium transition-colors ${
                      commentType === "public"
                        ? "bg-[var(--module-ticket-light)] text-[var(--module-ticket)]"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Public ({publicComments.length})
                  </button>
                  <button
                    onClick={() => setCommentType("internal")}
                    className={`px-3 py-1.5 rounded-tracker-md text-xs sm:text-sm font-medium transition-colors ${
                      commentType === "internal"
                        ? "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Internal ({internalComments.length})
                  </button>
                </div>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {(commentType === "public" ? publicComments : internalComments).length === 0 && (
                    <p className="text-sm text-ink-subtle text-center py-4">No {commentType} comments yet</p>
                  )}
                  {(commentType === "public" ? publicComments : internalComments).map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--module-ticket-light)] flex items-center justify-center text-[var(--module-ticket)] text-xs font-bold flex-shrink-0">
                        {c.commentedBy?.basicInfo?.firstName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">
                            {c.commentedBy?.basicInfo?.firstName} {c.commentedBy?.basicInfo?.lastName || "Unknown"}
                          </span>
                          <span className="text-xs text-ink-subtle">
                            {c.commentedAt ? new Date(c.commentedAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-sm text-ink mt-0.5">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    placeholder={commentType === "public" ? "Add a public comment..." : "Add an internal note..."}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-surface border border-hairline rounded-tracker-md text-ink placeholder:text-ink-subtle outline-none focus:border-[var(--tracker-border-focus)] transition-colors"
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
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
                    value={ticket.priority || "Medium"}
                    onChange={(e) => handleUpdate("priority", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-hairline rounded-tracker-md text-ink outline-none focus:border-[var(--tracker-border-focus)] transition-colors cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-[var(--module-ticket)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Status</span>
                  </div>
                  <select
                    value={ticket.status || "Open"}
                    onChange={(e) => handleUpdate("status", e.target.value)}
                    className={`w-full px-3 py-2 text-sm border-0 rounded-tracker-md outline-none cursor-pointer ${STATUS_CLS[ticket.status] || "bg-surface-2 text-ink-muted"}`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Testing">Testing</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-[var(--module-ticket)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Type</span>
                  </div>
                  <div className="text-sm text-ink">
                    <InlineEdit value={ticket.type?.name || ticket.type || ""} onSave={(v) => handleUpdate("type", v)} canEdit />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-[var(--module-ticket)]" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Category</span>
                  </div>
                  <div className="text-sm text-ink">{ticket.clientId?.name || "-"}</div>
                </div>

                {/* Assigned */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus size={13} className="text-ink-subtle" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Assigned</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ticket.assignedTo?.filter(Boolean).length > 0 ? ticket.assignedTo.filter(Boolean).map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[var(--module-ticket-light)] text-[var(--module-ticket)]">
                        {a.basicInfo?.firstName || "Unknown"}
                      </span>
                    )) : (
                      <span className="text-ink-subtle text-sm">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* ETA / Due Date */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays size={13} className="text-ink-subtle" />
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">ETA</span>
                  </div>
                  <input
                    type="date"
                    value={ticket.dueDate ? ticket.dueDate.split("T")[0] : ""}
                    onChange={(e) => handleUpdate("dueDate", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface border border-hairline rounded-tracker-md text-ink outline-none focus:border-[var(--tracker-border-focus)] transition-colors"
                  />
                </div>

                {/* About */}
                <div className="pt-3 border-t border-hairline-soft">
                  <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">About</h4>
                  <div className="space-y-2.5 text-sm">
                    <div>
                      <span className="text-ink-subtle text-xs block">Created By</span>
                      <span className="text-ink">
                        {ticket.createdBy?.basicInfo?.firstName} {ticket.createdBy?.basicInfo?.lastName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-subtle text-xs block">Created</span>
                      <span className="text-ink">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}</span>
                    </div>

                    {ticket.linkedTaskId && (
                      <div>
                        <span className="text-ink-subtle text-xs block">Linked Task</span>
                        <button
                          onClick={() => {
                            const taskId = typeof ticket.linkedTaskId === "object" ? ticket.linkedTaskId._id : ticket.linkedTaskId;
                            navigate(`/tasks/${taskId}`);
                          }}
                          className="text-[var(--module-ticket)] text-xs font-medium bg-[var(--module-ticket-light)] px-2 py-1 rounded-tracker-sm hover:bg-[var(--module-ticket)] hover:text-white transition-colors cursor-pointer mt-0.5"
                        >
                          {typeof ticket.linkedTaskId === "object" ? ticket.linkedTaskId.title || "Task" : "Task"}
                        </button>
                      </div>
                    )}
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

export default TicketDetailPage;
