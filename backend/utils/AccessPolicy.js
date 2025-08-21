// utils/accessPolicies.js

export const accessPolicies = {
  Employee: {
    read: {
      SuperAdmin: ['*'],   // full access
      HR: ['*'],
      Support: ['*'],
      Manager: ['*', '!salary'], // everything except salary
      Employee: ['self'] // only their own profile
    },
    create: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['basicInfo', 'contactInfo'], // manager can add basic employee info
      Employee: [] // employee can't create other employees
    },
    update: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['basicInfo', 'contactInfo'], // no salary updates
      Employee: ['contactInfo.phone'] // can only update their phone
    },
    delete: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: [], // manager cannot delete employee records
      Employee: [] // employees can't delete employees
    }
  },

  TaskType: {
    read: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['*'],
      Employee: ['*'] // employees can see all tasks
    },
    create: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['*'],
      Employee: ['self'] // can only create their own tasks
    },
    update: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['*'],
      Employee: ['self'] // only update their own tasks
    },
    delete: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['self'],
      Employee: ['self']
    }
  },

  Attendance: {
    read: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['*'],
      Employee: ['self'] // only their own attendance
    },
    create: {
      Employee: ['self'], // employees mark their own attendance
      SuperAdmin: ['*'],
      HR: ['*']
    },
    update: {
      Employee: ['self'],
      SuperAdmin: ['*'],
      HR: ['*']
    },
    delete: {
      SuperAdmin: ['*'],
      HR: ['*']
    }
  },

  LeavePolicy: {
    read: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['*'],
      Employee: ['*'] // all employees can view leave policies
    },
    create: {
      SuperAdmin: ['*'],
      HR: ['*']
    },
    update: {
      SuperAdmin: ['*'],
      HR: ['*']
    },
    delete: {
      SuperAdmin: ['*']
    }
  },

  LeaveType: {
    read: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['*'],
      Employee: ['*']
    },
    create: {
      SuperAdmin: ['*'],
      HR: ['*']
    },
    update: {
      SuperAdmin: ['*'],
      HR: ['*']
    },
    delete: {
      SuperAdmin: ['*']
    }
  },

  DailyActivity: {
    read: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Support: ['*'],
      Manager: ['*'],
      Employee: ['*'] // everyone can see activities
    },
    create: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['*'],
      Employee: ['self'] // only their own activities
    },
    update: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['self'],
      Employee: ['self']
    },
    delete: {
      SuperAdmin: ['*'],
      HR: ['*'],
      Manager: ['self'],
      Employee: ['self']
    }
  }
};