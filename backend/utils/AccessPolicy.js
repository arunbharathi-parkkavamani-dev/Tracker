// config/accessPolicies.js

const accessPolicies = {
  SuperAdmin: "*",
  HR: "*",

  Manager: {
    Employee: {
      read: { expect: ["salary"] }, // can read everything except salary
      update: { allow: ["department", "designation", "professionalInfo"] },
    },
    Department: "*",
    Designation: "*",
    LeavePolicy: "*",
    LeaveType: "*",
    Attendance: "*",
    Task: "*",
    Leave: "*",
  },

  Employee: {
    Employee: {
      read: { self: true, expect: ["salary"] },
      update: { self: true, allow: ["contactInfo"] },
    },
    Attendance: { self: true, allow: "*" },
    Task: { allow: "*" }, // tasks assigned to them
    Leave: { self: true, allow: "*" },
  },
};

export default accessPolicies;