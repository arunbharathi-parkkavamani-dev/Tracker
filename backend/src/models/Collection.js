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
import leave from "./Leave.js"
import statusGroups from "./StatusGroup.js"
import status from "./Status.js"

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
  leave,
  statusGroups,
  status
};

export default models;
