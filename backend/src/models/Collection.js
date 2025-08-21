// models/collection.js
import Employee from './Employee.js';
import Department from './Department.js';
import Designation from './Designation.js';
import LeaveTypes from './LeaveTypes.js';
import LeavePolicy from './LeavePolicy.js';
import Attendance from './Attendance.js';
import SideBar from './SideBar.js';
import TaskType from './TaskType.js'
import Client from './Client.js';
import DailyActivity from './DailyActivity.js';
import ApiHitLog from './ApiHitLog.js';
import ProjectType from './ProjectType.js';

const models = {
  Employee,
  Department,
  Designation,
  LeaveTypes,
  LeavePolicy,
  Attendance,
  SideBar,
  TaskType,
  Client,
  DailyActivity,
  ApiHitLog,
  ProjectType
};

export default models;