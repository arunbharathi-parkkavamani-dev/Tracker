import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import { useNavigate } from "react-router-dom";
import KanbanBoard from "../../components/Common/KambanBoard";
import GanttView from "./GanttView";
import TaskSkeleton from "../../components/Common/TaskSkeleton";
import FormDraftBanner from "../../components/Forms/FormDraftBanner";
import FilterDropdown from "../../components/Common/FilterDropdown";
import { FolderKanban, Plus, Search, X, ChevronDown, SlidersHorizontal, LayoutGrid, CalendarDays, Download } from "lucide-react";

const STATUS_COLS = [
  { id: "Backlogs",    title: "Backlogs" },
  { id: "To Do",       title: "To Do" },
  { id: "In Progress", title: "In Progress" },
  { id: "In Review",   title: "In Review" },
  { id: "Approved",    title: "Approved" },
  { id: "Completed",   title: "Completed" },
];
const PRIORITY_COLS = [
  { id: "Low",             title: "Low" },
  { id: "Medium",          title: "Medium" },
  { id: "High",            title: "High" },
  { id: "Weekly Priority", title: "Weekly Priority" },
];

const PRIORITIES = ["Low", "Medium", "High", "Weekly Priority"];
const STATUSES   = ["Backlogs", "To Do", "In Progress", "In Review", "Approved", "Completed"];

const TasksPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [allTasks, setAllTasks]         = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [taskTypes, setTaskTypes]       = useState([]);
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [groupBy, setGroupBy]           = useState("status");
  const [viewMode, setViewMode]         = useState("board"); // 'board' or 'gantt'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilters, setShowFilters]   = useState(false);

  // Filter state
  const [searchVal, setSearchVal] = useState("");
  const [fStatus,   setFStatus]   = useState(null);
  const [fPriority, setFPriority] = useState(null);
  const [fAssignee, setFAssignee] = useState(null);
  const [fClient,   setFClient]   = useState(null);
  const [fCategory, setFCategory] = useState(null);
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo,   setFDateTo]   = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tR, eR, tyR, cR] = await Promise.all([
        axiosInstance.post("/populate/read/tasks", {
          populateFields: {
            clientId:      "name",
            projectTypeId: "name",
            taskTypeId:    "name",
            createdBy:     "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
            assignedTo:    "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
            linkedTicketId: "title",
          },
          limit: 1000,
        }),
        axiosInstance.post("/populate/read/employees", {
          fields: "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
        }),
        axiosInstance.post("/populate/read/tasktypes"),
        axiosInstance.post("/populate/read/clients", { fields: "name" }),
      ]);
      setAllTasks(tR.data.data || []);
      setEmployees(eR.data.data || []);
      setTaskTypes(tyR.data.data || []);
      setClients(cR.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCardMove = async (task, _from, toCol) => {
    try {
      const field = groupBy === "status" ? "status" : "priorityLevel";
      await axiosInstance.put(`/populate/update/tasks/${task._id}`, { [field]: toCol });
      setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, [field]: toCol } : t));
    } catch (e) { console.error(e); }
  };

  const handleCardUpdate = async (task, field, value) => {
    try {
      // Optimistic update
      setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, [field]: value } : t));
      // API call
      await axiosInstance.put(`/populate/update/tasks/${task._id}`, { [field]: value });
    } catch (e) { 
      console.error(e); 
      // Revert if error
      setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, [field]: task[field] } : t));
    }
  };

  const handleExport = async () => {
    try {
      const res = await axiosInstance.get("/export/tasks", {
        params: { status: fStatus, priority: fPriority, client: fClient },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tasks_export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleTaskClick = (task) => {
    navigate(`/tasks/${task._id}`);
  };

  // ── Client-side filtering (passed to KanbanBoard as `data`) ─────────────────

  const filteredTasks = useMemo(() => {
    let d = allTasks;
    if (searchVal) {
      const q = searchVal.toLowerCase();
      d = d.filter(t =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.userStory || "").toLowerCase().includes(q) ||
        (t.linkedTicketId?.title || "").toLowerCase().includes(q)
      );
    }
    if (fStatus)   d = d.filter(t => t.status === fStatus);
    if (fPriority) d = d.filter(t => t.priorityLevel === fPriority);
    if (fAssignee) d = d.filter(t => t.assignedTo?.some(a => String(a._id || a) === fAssignee));
    if (fClient)   d = d.filter(t => {
      const cid = typeof t.clientId === "object" ? t.clientId?._id : t.clientId;
      return String(cid) === String(fClient);
    });
    if (fCategory) d = d.filter(t => {
      const catName = t.projectTypeId?.name || (typeof t.projectTypeId === "string" ? t.projectTypeId : "");
      return catName === fCategory;
    });
    if (fDateFrom) d = d.filter(t => t.createdAt && new Date(t.createdAt) >= new Date(fDateFrom));
    if (fDateTo)   d = d.filter(t => t.createdAt && new Date(t.createdAt) <= new Date(fDateTo + "T23:59:59"));
    return d;
  }, [allTasks, searchVal, fStatus, fPriority, fAssignee, fClient, fCategory, fDateFrom, fDateTo]);

  const activeFilters = [fStatus, fPriority, fAssignee, fClient, fCategory, fDateFrom, fDateTo].filter(Boolean).length;

  const clearFilters = () => {
    setFStatus(null); setFPriority(null);
    setFAssignee(null); setFClient(null); setFCategory(null); setFDateFrom(""); setFDateTo("");
  };

  const statusOptions = STATUSES.map(s => ({
    value: s, label: s,
    color: {
      'Backlogs': 'var(--ink-subtle)',
      'To Do': 'var(--tracker-warning)',
      'In Progress': 'var(--module-project)',
      'In Review': 'var(--module-hr)',
      'Approved': 'var(--tracker-success)',
      'Completed': 'var(--tracker-success)'
    }[s] || 'var(--ink-subtle)',
  }));

  const priorityOptions = PRIORITIES.map(p => ({
    value: p, label: p,
    color: {
      'Low': 'var(--tracker-success)',
      'Medium': 'var(--tracker-warning)',
      'High': 'var(--tracker-danger)',
      'Weekly Priority': 'var(--module-hr)'
    }[p] || 'var(--ink-subtle)',
  }));

  // ── Stat pills for page header (computed from allTasks) ───────────────────

  const statPills = useMemo(() => {
    const cols = groupBy === "status" ? STATUS_COLS : PRIORITY_COLS;
    return cols.map(col => {
      const count = allTasks.filter(t => (groupBy === "status" ? t.status : t.priorityLevel) === col.id).length;
      const colorCls = groupBy === "status"
        ? {
            "Backlogs":    "bg-surface-2 text-ink-muted",
            "To Do":       "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
            "In Progress": "bg-[var(--module-project-light)] text-[var(--module-project)]",
            "In Review":   "bg-[var(--module-hr-light)] text-[var(--module-hr)]",
            "Approved":    "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
            "Completed":   "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
          }[col.id]
        : {
            "Low":             "bg-[var(--tracker-success-light)] text-[var(--tracker-success)]",
            "Medium":          "bg-[var(--tracker-warning-light)] text-[var(--tracker-warning)]",
            "High":            "bg-[var(--tracker-danger-light)] text-[var(--tracker-danger)]",
            "Weekly Priority": "bg-[var(--module-hr-light)] text-[var(--module-hr)]",
          }[col.id];
      return { label: col.title, count, colorCls };
    }).filter(p => p.count > 0);
  }, [allTasks, groupBy]);

  if (loading) return <TaskSkeleton />;

  return (
    <div className="flex flex-col h-full bg-canvas" data-module="project">

      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-hairline-soft pb-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div>
            <p className="lmx-page-eyebrow mb-0.5">PROJECTS</p>
            <h1 className="text-[20px] font-semibold text-ink flex items-center gap-2 tracking-tight">
              <FolderKanban size={18} style={{ color: "var(--module-project)" }} />
              All Tasks
            </h1>
            <FormDraftBanner model="tasks" formPath="/tasks/form" label="task" />
          </div>
          {/* Vertical divider on larger screens */}
          <div className="hidden md:block w-px h-6 bg-hairline-soft self-center mt-3" />
          
          {/* Stat pills row (Status/Priority counts) on the first row */}
          <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-3">
            {statPills.map(p => (
              <span key={p.label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.colorCls}`}>
                <span className="font-bold">{p.count}</span>
                <span className="opacity-75">{p.label}</span>
              </span>
            ))}
            <span className="text-[11px] text-ink-subtle pl-1 self-center">{allTasks.length} total</span>
            {activeFilters > 0 && (
              <span className="text-[11px] text-[var(--module-project)] font-semibold pl-2 animate-in fade-in duration-200">
                ({filteredTasks.length} filtered)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 lg:mt-3">
          {/* Always-visible search input next to Filters */}
          <div className="relative w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search tasks..."
              className="lmx-input pl-8 pr-8 py-1.5 text-[12px]"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={12} className="text-ink-subtle" />
              </button>
            )}
          </div>

          {/* Group-by toggle — uses tab pattern per DESIGN.md */}
          <div className="lmx-tab-bar !p-0.5 !gap-0.5">
            {[{ id: "status", label: "Status" }, { id: "priorityLevel", label: "Priority" }].map(g => (
              <button key={g.id} onClick={() => setGroupBy(g.id)}
                className={`lmx-tab text-[11px] px-3 py-1.5 ${groupBy === g.id ? "lmx-tab-active" : ""}`}>
                {g.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="lmx-tab-bar !p-0.5 !gap-0.5 mr-2">
            <button onClick={() => setViewMode("board")}
              className={`lmx-tab text-[11px] px-3 py-1.5 ${viewMode === "board" ? "lmx-tab-active" : ""}`}>
              <LayoutGrid size={13} className="mr-1 inline-block" /> Board
            </button>
            <button onClick={() => setViewMode("gantt")}
              className={`lmx-tab text-[11px] px-3 py-1.5 ${viewMode === "gantt" ? "lmx-tab-active" : ""}`}>
              <CalendarDays size={13} className="mr-1 inline-block" /> Timeline
            </button>
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[12px] font-semibold border transition-all duration-150 cursor-pointer ${
              showFilters || activeFilters > 0
                ? "border-[var(--module-project)] bg-[var(--module-project-light)] text-[var(--module-project)]"
                : "border-hairline bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters {activeFilters > 0 && <span className="ml-0.5 bg-[var(--module-project)] text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>}
          </button>

          {/* Export Button */}
          <button onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[12px] font-semibold border border-hairline bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle transition-all duration-150 cursor-pointer">
            <Download size={13} /> Export
          </button>

          <button onClick={() => navigate("/tasks/form")}
            className="tracker-btn-accent flex items-center gap-1.5 text-[12px] px-3 py-1.5">
            <Plus size={13} /> New Task
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div className="tracker-card-plain p-3 mb-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="All Statuses" value={fStatus} onChange={setFStatus}
              options={statusOptions} type="status"
              accentColor="var(--module-project)"
            />
            <FilterDropdown
              label="All Priorities" value={fPriority} onChange={setFPriority}
              options={priorityOptions} type="status"
              accentColor="var(--module-project)"
            />
            <FilterDropdown
              label="All Assignees" value={fAssignee} onChange={setFAssignee}
              type="member"
              model="employees"
              fetchFields="basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage"
              accentColor="var(--module-project)"
            />
            <FilterDropdown
              label="All Clients" value={fClient} onChange={setFClient}
              type="default"
              model="clients"
              fetchFields="name"
              fetchTransform={item => ({
                value: item._id,
                label: item.name
              })}
              accentColor="var(--module-project)"
            />
            <FilterDropdown
              label="All Categories" value={fCategory} onChange={setFCategory}
              type="default"
              model="projecttypes"
              fetchFields="name"
              fetchTransform={item => ({
                value: item.name,
                label: item.name
              })}
              accentColor="var(--module-project)"
            />
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-ink-muted font-semibold">From</label>
              <input
                type="date" value={fDateFrom}
                onChange={e => setFDateFrom(e.target.value)}
                className="lmx-input py-1.5 text-[12px] w-[130px]"
              />
              <label className="text-[11px] text-ink-muted font-semibold">To</label>
              <input
                type="date" value={fDateTo}
                onChange={e => setFDateTo(e.target.value)}
                className="lmx-input py-1.5 text-[12px] w-[130px]"
              />
            </div>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-tracker-md text-[11px] font-semibold bg-[var(--tracker-danger-light)] text-[var(--tracker-danger)] hover:bg-[var(--tracker-danger)] hover:text-white transition-all duration-100 ml-auto"
              >
                <X size={11} /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Board / Timeline ── */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "board" ? (
          <KanbanBoard
            data={filteredTasks}
            groupBy={groupBy}
            columns={groupBy === "status" ? STATUS_COLS : PRIORITY_COLS}
            currentUserId={user?.id}
            onCardClick={handleTaskClick}
            onCardMove={handleCardMove}
            onCardUpdate={handleCardUpdate}
            employees={employees}
            taskTypes={taskTypes}
            clients={clients}
            showClientFilter={false}
            showFollowerFilter={false}
            hideHeader={true}
            onNewTask={() => navigate("/tasks/form")}
          />
        ) : (
          <GanttView 
            data={filteredTasks} 
            onTaskClick={handleTaskClick} 
          />
        )}
      </div>


    </div>
  );
};

export default TasksPage;
