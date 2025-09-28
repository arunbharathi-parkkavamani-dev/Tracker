// models/collection.js
import employees from "./Employee.js";
import department from "./Department.js";
import designation from "./Designation.js";
import leavetypes from "./LeaveTypes.js";
import leavepolicy from "./LeavePolicy.js";
import attendances from "./Attendance.js";
import sidebar from "./SideBar.js";
import tasktype from "./TaskType.js";
import client from "./Client.js";
import dailyactivity from "./DailyActivity.js";
import apihitlog from "./ApiHitLog.js";
import projecttype from "./ProjectType.js";
import accesspolicies from "./AccessPolicies.js";
import role from "./Role.js";
import notification from "./notification.js";

const models = {
  accesspolicies,
  employees,
  department,
  designation,
  leavetypes,
  leavepolicy,
  attendances,
  sidebar,
  tasktype,
  client,
  dailyactivity,
  apihitlog,
  projecttype,
  role,
  notification,
};

export default models;
