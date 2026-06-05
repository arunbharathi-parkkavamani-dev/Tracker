import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/authProvider";
import KanbanBoard from "../../../components/Common/KambanBoard";
import TaskModal from "../TaskModal";
import StatCard from "../../../components/Common/StatCard";
import { ArrowLeft, Building2, LayoutGrid, Clock, CheckCircle2, Plus } from "lucide-react";

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

const buildCategoryColumns = (tasks) => {
  const cats = [...new Set(tasks.map((t) => t.projectTypeId?.name).filter(Boolean))];
  if (!cats.length) cats.push("General");
  return cats.map((c) => ({ id: c, title: c }));
};

const ClientKanbanPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [client, setClient]             = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [taskTypes, setTaskTypes]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [groupBy, setGroupBy]           = useState("projectTypeId.name");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cR, tR, eR, tyR] = await Promise.all([
        axiosInstance.post(`/populate/read/clients/${id}`),
        axiosInstance.post("/populate/read/tasks", {
          filter: { clientId: id },
          populateFields: {
            clientId:      "name",
            projectTypeId: "name",
            taskTypeId:    "name",
            createdBy:     "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
            assignedTo:    "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
          },
        }),
        axiosInstance.post("/populate/read/employees"),
        axiosInstance.post("/populate/read/tasktypes"),
      ]);
      setClient(cR.data.data);
      setTasks(tR.data.data || []);
      setEmployees(eR.data.data || []);
      setTaskTypes(tyR.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCardMove = async (task, _from, toCol) => {
    try {
      if (groupBy === "projectTypeId.name") {
        const matched = taskTypes.find((t) => t.name === toCol);
        if (matched) await axiosInstance.put(`/populate/update/tasks/${task._id}`, { projectTypeId: matched._id });
      } else {
        const field = groupBy === "status" ? "status" : "priorityLevel";
        await axiosInstance.put(`/populate/update/tasks/${task._id}`, { [field]: toCol });
      }
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleTaskClick = async (task) => {
    try {
      const res = await axiosInstance.post(`/populate/read/tasks/${task._id}`, {
        fields: "clientId,projectTypeId,taskTypeId,createdBy,assignedTo",
      });
      setSelectedTask(res.data.data);
    } catch (e) { console.error(e); }
  };

  const columnsMap = {
    "projectTypeId.name": buildCategoryColumns(tasks),
    "status":             STATUS_COLS,
    "priorityLevel":      PRIORITY_COLS,
  };

  const total      = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const completed  = tasks.filter((t) => t.status === "Completed").length;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-accent)] border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-canvas" data-module="project">
      <div className="px-6 pt-6 pb-4 space-y-5">

        {/* back */}
        <button onClick={() => navigate("/tasks/clients-tasks")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--module-accent)] hover:opacity-75 transition-opacity">
          <ArrowLeft size={14} /> All Clients
        </button>

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="lmx-page-eyebrow mb-1">PROJECTS</p>
            <h1 className="text-[28px] font-semibold text-ink flex items-center gap-2.5 tracking-tight">
              <Building2 size={22} className="text-[var(--module-project)]" />
              {client?.name || "Client Board"}
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {total} task{total !== 1 ? "s" : ""} · {columnsMap["projectTypeId.name"].length} categor{columnsMap["projectTypeId.name"].length !== 1 ? "ies" : "y"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Group-by */}
            <div className="flex items-center gap-1 p-1 rounded-tracker-lg bg-surface-2">
              {[
                { id: "projectTypeId.name", label: "Category" },
                { id: "status",             label: "Status" },
                { id: "priorityLevel",      label: "Priority" },
              ].map((g) => (
                <button key={g.id} onClick={() => setGroupBy(g.id)}
                  className={`px-3 py-1.5 rounded-tracker-md text-[13px] font-medium transition-all ${
                    groupBy === g.id ? "bg-[var(--module-accent)] text-white shadow-sm" : "text-ink-muted hover:text-ink"
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>

            <button onClick={() => navigate("/tasks/form", { state: { selectedClient: client } })}
              className="tracker-btn-accent flex items-center gap-2">
              <Plus size={15} /> New Task
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="Total"       value={total}      icon={LayoutGrid}   color="blue" />
          <StatCard title="In Progress" value={inProgress} icon={Clock}        color="yellow" />
          <StatCard title="Completed"   value={completed}  icon={CheckCircle2} color="green" />
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <KanbanBoard
          data={tasks}
          groupBy={groupBy}
          columns={columnsMap[groupBy]}
          currentUserId={user?.id}
          onCardClick={handleTaskClick}
          onCardMove={handleCardMove}
          employees={employees}
          taskTypes={taskTypes}
          showFollowerFilter
          onNewTask={() => navigate("/tasks/form", { state: { selectedClient: client } })}
        />
      </div>

      {selectedTask && (
        <div className="fixed inset-0 tracker-overlay z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-tracker-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "var(--tracker-shadow-overlay)" }}>
            <div className="flex items-center justify-between px-6 py-4 text-white rounded-t-[16px] bg-gradient-to-br from-[#0369A1] to-[#0EA5E9]">
              <span className="text-[16px] font-semibold">{client?.name} · Task Detail</span>
              <button onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-lg font-bold">×</button>
            </div>
            <div className="p-6">
              <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)}
                onUpdate={() => { fetchData(); setSelectedTask(null); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientKanbanPage;
