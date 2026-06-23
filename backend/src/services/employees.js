import bcrypt from 'bcryptjs';

export default function employeesService() {
  return {
    /**
     * beforeCreate: Hash the password inside authInfo before saving a new employee.
     */
    async beforeCreate({ body }) {
      if (body?.authInfo?.password) {
        const salt = await bcrypt.genSalt(12);
        body.authInfo.password = await bcrypt.hash(body.authInfo.password, salt);
      }

      // Initialize Leave Status Buckets based on Department Leave Policy
      try {
        const deptId = body?.professionalInfo?.department;
        if (deptId) {
          const { default: models } = await import('../models/Collection.js');
          const dept = await models.departments.findById(deptId).populate({
            path: 'leavePolicy',
            populate: { path: 'leaves.leaveType' }
          }).lean();

          const policy = dept?.leavePolicy;
          if (policy && Array.isArray(policy.leaves)) {
            body.leaveStatus = policy.leaves.map(policyLeaf => ({
              leaveType: policyLeaf.leaveType?._id || policyLeaf.leaveType,
              usedThisMonth: 0,
              usedThisYear: 0,
              carriedForward: 0,
              available: policyLeaf.maxDaysPerYear || 0
            }));
          }
        }
      } catch (error) {
        console.error("[EmployeeService] Failed to initialize leave balance from policy:", error.message);
      }
    },

    /**
     * beforeUpdate: If password is being updated, hash it before saving.
     */
    async beforeUpdate({ body }) {
      if (body?.authInfo?.password) {
        const salt = await bcrypt.genSalt(12);
        body.authInfo.password = await bcrypt.hash(body.authInfo.password, salt);
      }
    }
  };
}
