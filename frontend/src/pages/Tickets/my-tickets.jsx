import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TableGenerator from "../../components/Common/TableGenerator";
import FormRenderer from "../../components/Common/FormRenderer";
import { Plus, User, X } from "lucide-react";

/* ── Chip helpers using CSS vars only ── */
const PRIORITY_CLS = {
  Critical: "bg-[var(--tracker-danger-light)]  text-[var(--tracker-danger)]",
  High:     "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  Medium:   "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  Low:      "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
};
const STATUS_CLS = {
  "Open":        "bg-[var(--tracker-info-light)]    text-[var(--tracker-info)]",
  "In Progress": "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
  "Review":      "bg-[var(--module-hr-light)]        text-[var(--module-hr)]",
  "Testing":     "bg-[var(--brand-teal-light)]       text-[var(--brand-teal)]",
  "Completed":   "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
  "Closed":      "bg-surface-2 text-ink-muted",
};

/* ── Branded modal ── */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 tracker-overlay z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-surface rounded-tracker-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      style={{ boxShadow: "var(--tracker-shadow-overlay)" }}>
      <div className="flex items-center justify-between px-6 py-5 text-white bg-gradient-to-br from-[#9F1239] to-[#E11D48] rounded-t-[16px]">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto p-6">{children}</div>
    </div>
  </div>
);

/* ════════════════════════════════════════ */
const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  useEffect(() => { fetchMyTickets(); }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/populate/read/tickets", {
        filter: { $or: [{ createdBy: user.id }, { assignedTo: user.id }] },
        fields: "assignedTo,accountManager,createdBy,linkedTaskId",
      });
      setTickets(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (formData) => {
    try {
      await axiosInstance.post("/populate/create/tickets", { ...formData, createdBy: user.id });
      fetchMyTickets(); setShowCreate(false);
    } catch (e) { console.error(e); throw e; }
  };

  const handleUpdate = async (formData) => {
    try {
      await axiosInstance.put(`/populate/update/tickets/${editingTicket._id}`, formData);
      fetchMyTickets(); setEditingTicket(null);
    } catch (e) { console.error(e); throw e; }
  };

  const ticketFormFields = [
    { name: "title",     label: "Title",       type: "text",     placeholder: "Brief description of the issue", gridClass: "col-span-2" },
    { name: "userStory", label: "Description", type: "textarea", placeholder: "Detailed description...", rows: 4, gridClass: "col-span-2" },
    { name: "product",   label: "Product",     type: "text",     placeholder: "Product name" },
    { name: "type",      label: "Type",        type: "AutoComplete", source: "", options: [
      { _id: "Bug", name: "Bug" }, { _id: "Feature", name: "Feature" },
      { _id: "Enhancement", name: "Enhancement" }, { _id: "Support", name: "Support" },
    ]},
    { name: "priority",  label: "Priority",    type: "AutoComplete", source: "", options: [
      { _id: "Low", name: "Low" }, { _id: "Medium", name: "Medium" },
      { _id: "High", name: "High" }, { _id: "Critical", name: "Critical" },
    ]},
    { name: "dueDate",   label: "Due Date",    type: "date" },
  ];

  const createdByMe  = tickets.filter((t) => t.createdBy?._id === user.id).length;
  const assignedToMe = tickets.filter((t) => t.assignedTo?.some((a) => a._id === user.id)).length;
  const openCount    = tickets.filter((t) => t.status === "Open").length;

  const customRender = {
    priority: (t) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-tracker-sm text-[12px] font-semibold ${PRIORITY_CLS[t.priority] || PRIORITY_CLS.Medium}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {t.priority || "Medium"}
      </span>
    ),
    status: (t) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${STATUS_CLS[t.status] || "bg-surface-2 text-ink-muted"}`}>
        {t.status}
      </span>
    ),
    type: (t) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)]">
        {t.type?.name || t.type || "Bug"}
      </span>
    ),
    title: (t) => (
      <span className="max-w-[260px] truncate block font-medium text-[13px] text-ink" title={t.title}>
        {t.title || "-"}
      </span>
    ),
    __actions: (t) => (
      <button onClick={() => setEditingTicket(t)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[12px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)] hover:bg-[var(--module-ticket)] hover:text-white transition-colors">
        Edit
      </button>
    ),
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-ticket)] border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4" data-module="ticket">

      {/* ── Compact header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={16} className="text-[var(--module-ticket)]" />
          <h1 className="text-[15px] font-semibold text-ink tracking-tight">My Tickets</h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)]">{createdByMe} Created</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-success-light)] text-[var(--tracker-success)]">{assignedToMe} Assigned</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-info-light)] text-[var(--tracker-info)]">{openCount} Open</span>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="tracker-btn-accent flex items-center gap-1.5 text-[12px] px-3 py-1.5">
          <Plus size={13} /> New Ticket
        </button>
      </div>

      {/* ── Table ── */}
      <TableGenerator
        title="My Ticket List"
        data={tickets}
        customRender={customRender}
        customColumns={["title", "type", "priority", "status", "dueDate", "createdAt"]}
        enableActions
        onEdit={(t) => setEditingTicket(t)}
      />

      {showCreate && (
        <Modal title="Create New Ticket" onClose={() => setShowCreate(false)}>
          <FormRenderer fields={ticketFormFields} onSubmit={handleCreate}
            submitButton={{ text: "Create Ticket", color: "red" }} />
        </Modal>
      )}

      {editingTicket && (
        <Modal title="Edit Ticket" onClose={() => setEditingTicket(null)}>
          <FormRenderer fields={ticketFormFields} data={editingTicket} onSubmit={handleUpdate}
            submitButton={{ text: "Save Changes", color: "red" }} />
        </Modal>
      )}
    </div>
  );
};

export default MyTickets;
