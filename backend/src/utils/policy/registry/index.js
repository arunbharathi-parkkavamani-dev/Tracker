import AccessPolicies from "../../../models/AccessPolicies.js";

// Registry of reusable logic functions for policies
// Each function behaves like a "Computed Filter" or "Runtime Check"

// Function Signature: (user, record, context) => boolean | mongoFilterObject
// - If it returns a Boolean: True = Allow, False = Deny (used for single record checks)
// - If it returns an Object: It's treated as a Mongo query filter (used for list/find queries)

const registry = {
  isSelf: (user, record, context) => {
    // Check if the record belongs to the user
    // For queries, return filter: { _id: user.id } or { userId: user.id }
    // context.modelName can help decide which field to check
    if (!user) return false;

    // If we are checking a specific record (record is populated)
    if (record) {
      return record._id.toString() === user.id || record.userId?.toString() === user.id;
    }

    // If we are building a query filter
    return {
      $or: [
        { _id: user.id },
        { userId: user.id },
        { employee: user.id } // For attendance/leaves
      ]
    };
  },

  isManager: (user, record, context) => {
    // Check if user is a manager (logic depends on your hierarchy)
    if (!user) return false;

    // Simple filter: Records where reportingManager is the user
    return {
      $or: [
        { reportingManager: user.id },
        { "professionalInfo.reportingManager": user.id }
      ]
    };
  },

  isTeamMember: (user, record, context) => {
    // Check if user is a member of the record's team
    // Implementation depends on specific data structure
    return true;
  },

  // Dynamic Sidebar Visibility (Dept + Designation)
  matchSidebarPermissions: (user, record, context) => {
    // Requires department & designation in JWT/User object
    if (!user) return false;

    // Logic: (AllowedDept has user.dept OR is Empty) AND (AllowedDesig has user.desig OR is Empty)
    return {
      $and: [
        {
          $or: [
            { allowedDepartments: { $in: [user.department] } },
            { allowedDepartments: { $size: 0 } },
            { allowedDepartments: { $exists: false } }
          ]
        },
        {
          $or: [
            { allowedDesignations: { $in: [user.designation] } },
            { allowedDesignations: { $size: 0 } },
            { allowedDesignations: { $exists: false } }
          ]
        }
      ]
    };
  }
};

export const getRegistry = (name) => {
  return registry[name];
};

export const listRegistries = () => {
  return Object.keys(registry);
};

export default {
  getRegistry,
  listRegistries,
  ...registry
};
