import cron from "node-cron";
import models from "../models/Collection.js";

// Monthly Accrual: Runs on the 1st of every month at 12:00 AM (midnight)
cron.schedule("0 0 1 * *", async () => {
  try {
    // console.log("🕐 [Cron] Starting monthly leave accrual processing...");
    const employees = await models.employees.find({ status: "Active" });

    for (const employee of employees) {
      const deptId = employee.professionalInfo?.department;
      if (!deptId) continue;

      const dept = await models.departments.findById(deptId).populate({
        path: "leavePolicy",
        populate: { path: "leaves.leaveType" }
      }).lean();

      const policy = dept?.leavePolicy;
      if (!policy || !Array.isArray(policy.leaves)) continue;

      let modified = false;

      policy.leaves.forEach(policyLeaf => {
        const leaveTypeId = policyLeaf.leaveType?._id || policyLeaf.leaveType;
        if (!leaveTypeId) return;

        let bucket = employee.leaveStatus.find(
          b => b.leaveType.toString() === leaveTypeId.toString()
        );

        const accrualAmount = policyLeaf.maxDaysPerMonth || 0;
        const cap = policyLeaf.maxDaysPerYear || 12;

        if (bucket) {
          // Increment balance, clamp at annual limit
          const newAvailable = Math.min(bucket.available + accrualAmount, cap);
          if (bucket.available !== newAvailable) {
            bucket.available = newAvailable;
            modified = true;
          }
          // Reset monthly usage tracking
          bucket.usedThisMonth = 0;
        } else {
          // Initialize bucket
          employee.leaveStatus.push({
            leaveType: leaveTypeId,
            usedThisMonth: 0,
            usedThisYear: 0,
            carriedForward: 0,
            available: accrualAmount
          });
          modified = true;
        }
      });

      if (modified) {
        await employee.save();
      }
    }
    // console.log("✅ [Cron] Monthly leave accrual completed.");
  } catch (error) {
    console.error("❌ [Cron] Monthly leave accrual failed:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Yearly Rollover: Runs on January 1st at 12:00 AM
cron.schedule("0 0 1 1 *", async () => {
  try {
    // console.log("🕐 [Cron] Starting yearly leave rollover and carry forward processing...");
    const employees = await models.employees.find({ status: "Active" });

    for (const employee of employees) {
      const deptId = employee.professionalInfo?.department;
      if (!deptId) continue;

      const dept = await models.departments.findById(deptId).populate({
        path: "leavePolicy",
        populate: { path: "leaves.leaveType" }
      }).lean();

      const policy = dept?.leavePolicy;
      if (!policy || !Array.isArray(policy.leaves)) continue;

      let modified = false;

      policy.leaves.forEach(policyLeaf => {
        const leaveTypeId = policyLeaf.leaveType?._id || policyLeaf.leaveType;
        if (!leaveTypeId) return;

        let bucket = employee.leaveStatus.find(
          b => b.leaveType.toString() === leaveTypeId.toString()
        );

        if (bucket) {
          const unused = bucket.available;
          let carryAmount = 0;

          if (policyLeaf.carryForward && unused > 0) {
            // Carry forward unused leaves, clamped by policy annual allocation limit
            carryAmount = Math.min(unused, policyLeaf.maxDaysPerYear);
          }

          bucket.carriedForward = carryAmount;
          bucket.usedThisYear = 0;
          bucket.usedThisMonth = 0;
          // Refresh balance with carry forward + initial policy quota allocation
          bucket.available = carryAmount + (policyLeaf.maxDaysPerYear || 0);
          modified = true;
        }
      });

      if (modified) {
        await employee.save();
      }
    }
    // console.log("✅ [Cron] Yearly leave rollover completed.");
  } catch (error) {
    console.error("❌ [Cron] Yearly leave rollover failed:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});
