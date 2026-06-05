import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import { useNavigate } from "react-router-dom";
import KanbanBoard from "../../components/Common/KambanBoard";
import FormDraftBanner from "../../components/Forms/FormDraftBanner";
import TaskModal from "./TaskModal";
import { FolderKanban, Plus } from "lucide-react";

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

const TasksPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [tasks, setTasks]               = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [taskTypes, setTaskTypes]       = useState([]);
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [groupBy, setGroupBy]           = useState("status");
  const [selectedTask, setSelectedTask] = useState(null);

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
          },
        }),
        axiosInstance.post("/populate/read/employees", { fields: "basicInfo.firstName,basicInfo.lastName" }),
        axiosInstance.post("/populate/read/tasktypes"),
        axiosInstance.post("/populate/read/clients", { fields: "name" }),
      ]);
      setTasks(tR.data.data || []);
      setEmployees(eR.data.data || []);
      setTaskTypes(tyR.data.data || []);
      setClients(cR.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCardMove = async (task, _from, toCol) => {
    try {
      const field = groupBy === "status" ? "status" : "priorityLevel";
      await axiosInstance.put(`/populate/update/tasks/${task._id}`, { [field]: toCol });
      setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, [field]: toCol } : t));
    } catch (e) { console.error(e); }
  };

  const handleTaskClick = async (task) => {
    try {
      const res = await axiosInstance.post(`/populate/read/tasks/${task._id}`, {
        populateFields: {
          clientId:      "name",
          projectTypeId: "name",
          taskTypeId:    "name",
          createdBy:     "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
          assignedTo:    "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage",
        },
      });
      setSelectedTask(res.data.data);
    } catch (e) { console.error(e); }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--module-accent)] border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-canvas" data-module="project">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-[var(--module-project)]" />
          <h1 className="text-[15px] font-semibold text-ink tracking-tight">All Tasks</h1>
          <FormDraftBanner model="tasks" formPath="/tasks/form" label="task" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-tracker-md bg-surface-2">
            {[{ id: "status", label: "Status" }, { id: "priorityLevel", label: "Priority" }].map((g) => (
              <button key={g.id} onClick={() => setGroupBy(g.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all ${
                  groupBy === g.id ? "bg-[var(--module-accent)] text-white" : "text-ink-muted hover:text-ink"
                }`}>
                {g.label}
              </button>
            ))}
          </div>
          <button onClick={() => navigate("/tasks/form")} className="tracker-btn-accent flex items-center gap-1.5 text-[12px] px-3 py-1.5">
            <Plus size={13} /> New Task
          </button>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          data={tasks}
          groupBy={groupBy}
          columns={groupBy === "status" ? STATUS_COLS : PRIORITY_COLS}
          currentUserId={user?.id}
          onCardClick={handleTaskClick}
          onCardMove={handleCardMove}
          employees={employees}
          taskTypes={taskTypes}
          clients={clients}
          showClientFilter
          showFollowerFilter
          onNewTask={() => navigate("/tasks/form")}
        />
      </div>

      {selectedTask && (
        <div className="fixed inset-0 tracker-overlay z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-tracker-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "var(--tracker-shadow-overlay)" }}>
            <div className="flex items-center justify-between px-6 py-4 text-white rounded-t-[16px] bg-gradient-to-br from-[#0369A1] to-[#0EA5E9]">
              <span className="text-[16px] font-semibold">Task Detail</span>
              <button onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-lg font-bold">×</button>
            </div>
            <div className="p-6">
              <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)}
                onUpdate={() => { fetchAll(); setSelectedTask(null); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
