import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TableGenerator from "../../components/Common/TableGenerator";
import { useNavigate } from "react-router-dom";
import { entityFormPath } from "../../utils/formRoutes";
import FormDraftBanner from "../../components/Forms/FormDraftBanner";
import StatCard from "../../components/Common/StatCard";
import { Plus, TicketCheck, Pencil, ArrowRightCircle, CheckCircle2 } from "lucide-react";

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

const PriorityChip = ({ value }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-tracker-sm text-[12px] font-semibold ${PRIORITY_CLS[value] || PRIORITY_CLS.Medium}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {value || "Medium"}
  </span>
);

const StatusChip = ({ value }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${STATUS_CLS[value] || "bg-surface-2 text-ink-muted"}`}>
    {value}
  </span>
);

const TypeChip = ({ value }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)]">
    {value || "Bug"}
  </span>
);

/* ════════════════════════════════════════ */
const TicketsPage = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/populate/read/tickets", {
        fields: "assignedTo,accountManager,createdBy,linkedTaskId",
      });
      setTickets((res.data.data || []).map(({ professionalInfo, ...t }) => t));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handlePushToTask = async (ticket) => {
    try {
      await axiosInstance.put(`/populate/update/tickets/${ticket._id}`, { pushTaskSync: true });
      fetchTickets();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (ticket) => navigate(entityFormPath("/Tickets", ticket._id));

  const weekAgo       = new Date(Date.now() - 7 * 86400000);
  const openCount     = tickets.filter((t) => t.status === "Open").length;
  const inProgCount   = tickets.filter((t) => t.status === "In Progress").length;
  const criticalCount = tickets.filter((t) => t.priority === "Critical").length;
  const resolvedCount = tickets.filter((t) => t.status === "Completed" && new Date(t.updatedAt) > weekAgo).length;

  const customRender = {
    priority:    (t) => <PriorityChip value={t.priority} />,
    status:      (t) => <StatusChip value={t.status} />,
    type:        (t) => <TypeChip value={t.type?.name || t.type} />,

    title: (t) => (
      <span className="max-w-[260px] truncate block font-medium text-[13px] text-ink" title={t.title}>
        {t.title || "-"}
      </span>
    ),

    accountManager: (t) => {
      const p = t.accountManager?.basicInfo || t.assignedTo?.[0]?.basicInfo;
      return <span className="text-[13px] text-ink-muted">{p ? `${p.firstName} ${p.lastName}` : "-"}</span>;
    },

    userStory: (t) => (
      <span className="max-w-[220px] truncate block text-[13px] text-ink-muted" title={t.userStory}>
        {t.userStory || t.description || "-"}
      </span>
    ),

    assignedTo: (t) => {
      if (!t.assignedTo?.length) return <span className="text-ink-subtle">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {t.assignedTo.slice(0, 2).map((a, i) => {
            const name = `${a?.basicInfo?.firstName || ""} ${a?.basicInfo?.lastName || ""}`.trim() || "Unknown";
            return (
              <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)]">
                {name}
              </span>
            );
          })}
          {t.assignedTo.length > 2 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-ink-muted">
              +{t.assignedTo.length - 2}
            </span>
          )}
        </div>
      );
    },

    linkedTaskId: (t) => t.linkedTaskId ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--tracker-success-light)] text-[var(--tracker-success)]">
        <CheckCircle2 size={11} /> Linked
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-surface-2 text-ink-muted">No Task</span>
    ),

    __actions: (ticket) => {
      const converted = ticket.isConvertedToTask || Boolean(ticket.linkedTaskId);
      return (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(ticket)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[12px] font-semibold bg-[var(--module-ticket-light)] text-[var(--module-ticket)] hover:bg-[var(--module-ticket)] hover:text-white transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={() => !converted && handlePushToTask(ticket)}
            disabled={converted}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[12px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              converted ? "bg-surface-2 text-ink-muted" : "bg-[var(--tracker-info-light)] text-[var(--tracker-info)] hover:bg-[var(--tracker-info)] hover:text-white"
            }`}>
            <ArrowRightCircle size={12} />
            {converted ? "Converted" : "→ Task"}
          </button>
        </div>
      );
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-ticket)] border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4" data-module="ticket">
      <FormDraftBanner model="tickets" formPath={entityFormPath("/Tickets")} label="ticket" />

      {/* ── Compact header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TicketCheck size={16} className="text-[var(--module-ticket)]" />
          <h1 className="text-[15px] font-semibold text-ink tracking-tight">Ticket Queue</h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-info-light)] text-[var(--tracker-info)]">{openCount} Open</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]">{inProgCount} In Progress</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-danger-light)] text-[var(--tracker-danger)]">{criticalCount} Critical</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tracker-success-light)] text-[var(--tracker-success)]">{resolvedCount} Resolved</span>
          </div>
        </div>
        <button onClick={() => navigate(entityFormPath("/Tickets"))} className="tracker-btn-accent flex items-center gap-1.5 text-[12px] px-3 py-1.5">
          <Plus size={13} /> New Ticket
        </button>
      </div>

      {/* ── Table ── */}
      <TableGenerator
        title="All Tickets"
        data={tickets}
        customRender={customRender}
        customColumns={["title", "type", "priority", "status", "assignedTo", "accountManager", "linkedTaskId", "dueDate", "createdAt"]}
        enableActions
        onEdit={handleEdit}
      />
    </div>
  );
};

export default TicketsPage;
