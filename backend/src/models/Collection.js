// models/collection.js
import employees from "./Employee.js";
import departments from "./Department.js";
import designations from "./Designation.js";
import leavetypes from "./LeaveTypes.js";
import leavepolicy from "./LeavePolicy.js";
import attendances from "./Attendance.js";
import sidebars from "./SideBar.js";
import tasktypes from "./TaskType.js";
import clients from "./Client.js";
import dailyactivities from "./DailyActivity.js";
import apihitlogs from "./ApiHitLog.js";
import projecttypes from "./ProjectType.js";
import accesspolicies from "./AccessPolicies.js";
import roles from "./Role.js";
import notifications from "./notification.js";
import leaves from "./Leave.js"
import tasks from "./Tasks.js"
import commentsthreads from "./CommentsThreads.js"
import session from "./Session.js";
import todos from "./Todo.js";
import auditlog from "./AuditLog.js";
import errorlog from "./ErrorLog.js";
import expenses from "./Expense.js";
import payrolls from "./Payroll.js";
import tickets from "./Ticket.js";
import shifts from "./Shift.js";
import hrpolicies from "./HRPolicy.js";
import agents from "./Agent.js";
import milestones from "./MileStone.js";
import emailconfigs from "./EmailConfig.js";
import referencetypes from "./ReferenceType.js";
import leadtypes from "./LeadType.js";

const models = {
  accesspolicies,
  employees,
  departments,
  designations,
  leavetypes,
  leavepolicy,
  attendances,
  sidebars,
  tasktypes,
  clients,
  dailyactivities,
  apihitlogs,
  projecttypes,
  roles,
  notifications,
  leaves,
  tasks,
  commentsthreads,
  session,
  todos,
  auditlog,
  errorlog,
  expenses,
  payrolls,
  tickets,
  shifts,
  hrpolicies,
  agents,
  emailconfigs,
  milestones,
  referencetypes,
  leadtypes
};

export default models;
