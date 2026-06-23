import cron from "node-cron";
import models from "../models/Collection.js";
import approvalEngine from "../utils/approval/approvalEngine.js";

// Runs daily at 1:00 AM
cron.schedule("0 1 * * *", async () => {
  try {
    // console.log("🕐 [Cron] Scanning pending approvals for timeout escalation...");
    const now = new Date();

    // 1. Process Leaves
    const pendingLeaves = await models.leaves.find({ status: "Pending", metaStatus: "active" });
    for (const leave of pendingLeaves) {
      if (leave.workflowId) {
        const workflow = await models.approvalworkflows.findById(leave.workflowId).lean();
        if (workflow && workflow.steps) {
          const currentStep = workflow.steps[leave.currentStepIndex];
          const timeoutDays = currentStep?.timeoutDays || 3;
          
          // Calculate time since last update (or creation)
          const baseDate = leave.updatedAt || leave.createdAt;
          const elapsedMs = now - new Date(baseDate);
          const limitMs = timeoutDays * 24 * 60 * 60 * 1000;

          if (elapsedMs >= limitMs) {
            console.log(`[Cron] Escalating Leave request ${leave._id} due to timeout.`);
            await approvalEngine.escalate(leave);
          }
        }
      }
    }

    // 2. Process Regularizations
    const pendingRegularizations = await models.regularizations.find({ status: "Pending", metaStatus: "active" });
    for (const reg of pendingRegularizations) {
      if (reg.workflowId) {
        const workflow = await models.approvalworkflows.findById(reg.workflowId).lean();
        if (workflow && workflow.steps) {
          const currentStep = workflow.steps[reg.currentStepIndex];
          const timeoutDays = currentStep?.timeoutDays || 3;

          const baseDate = reg.updatedAt || reg.createdAt;
          const elapsedMs = now - new Date(baseDate);
          const limitMs = timeoutDays * 24 * 60 * 60 * 1000;

          if (elapsedMs >= limitMs) {
            console.log(`[Cron] Escalating Regularization request ${reg._id} due to timeout.`);
            await approvalEngine.escalate(reg);
          }
        }
      }
    }

    // console.log("✅ [Cron] Approval timeout scans completed.");
  } catch (error) {
    console.error("❌ [Cron] Approval timeout scan failed:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});
