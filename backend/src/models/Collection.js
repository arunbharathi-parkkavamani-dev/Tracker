// models/collection.js
import employees from "./Employee.js";
import department from "./Department.js";
import designation from "./Designation.js";
import leavetypes from "./LeaveTypes.js";
import leavepolicy from "./LeavePolicy.js";
import attendances from "./Attendance.js";
import sidebar from "./SideBar.js";
import tasktypes from "./TaskType.js";
import clients from "./Client.js";
import dailyactivities from "./DailyActivity.js";
import apihitlog from "./ApiHitLog.js";
import projecttypes from "./ProjectType.js";
import accesspolicies from "./AccessPolicies.js";
import role from "./Role.js";
import notification from "./notification.js";
import leaves from "./Leave.js"
import tasks from "./Tasks.js"
import commentsthreads from "./CommentsThreads.js"


const models = {
  accesspolicies,
  employees,
  department,
  designation,
  leavetypes,
  leavepolicy,
  attendances,
  sidebar,
  tasktypes,
  clients,
  dailyactivities,
  apihitlog,
  projecttypes,
  role,
  notification,
  leaves,
  tasks,
  commentsthreads
};

export default models;
