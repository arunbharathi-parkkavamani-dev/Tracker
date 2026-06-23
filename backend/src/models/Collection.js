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
import ticket_comments from "./TicketComment.js";
import ticket_comment_reads from "./TicketCommentRead.js";
import ticket_participants from "./TicketParticipant.js";
import ticket_activity_logs from "./TicketActivityLog.js";
import ticket_status_history from "./TicketStatusHistory.js";
import ticket_assignments from "./TicketAssignment.js";
import ticket_attachments from "./TicketAttachment.js";
import shifts from "./Shift.js";
import hrpolicies from "./HRPolicy.js";
import agents from "./Agent.js";
import milestones from "./MileStone.js";
import regularizations from "./Regularization.js";
import emailconfigs from "./EmailConfig.js";
import referencetypes from "./ReferenceType.js";
import leadtypes from "./LeadType.js";
import feedgroups from "./FeedGroup.js";
import feedchannels from "./FeedChannel.js";
import feedposts from "./FeedPost.js";
import feedcomments from "./FeedComment.js";
import NotificationReceptionist from "./NotificationReceptionist.js";
import notificationpreferences from "./NotificationPreference.js";
import products from "./products.js";
import salarystructures from "./SalaryStructure.js";
import payrollruns from "./PayrollRun.js";
import holidays from "./Holiday.js";
import statusconfigs from "./StatusConfig.js";
import statusmappings from "./StatusMapping.js";
import dashboardwidgets from "./DashboardWidget.js";
import approvalworkflows from "./ApprovalWorkflow.js";
import activitylogs from "./ActivityLog.js";
import timetrackersessions from "./TimeTrackerSession.js";

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
  ticket_comments,
  ticket_comment_reads,
  ticket_participants,
  ticket_activity_logs,
  ticket_status_history,
  ticket_assignments,
  ticket_attachments,
  shifts,
  hrpolicies,
  agents,
  emailconfigs,
  milestones,
  regularizations,
  referencetypes,
  leadtypes,
  feedgroups,
  feedchannels,
  feedposts,
  feedcomments,
  NotificationReceptionist,
  notificationpreferences,
  products,
  salarystructures,
  payrollruns,
  holidays,
  statusconfigs,
  statusmappings,
  dashboardwidgets,
  approvalworkflows,
  activitylogs,
  timetrackersessions,
};

export default models;
