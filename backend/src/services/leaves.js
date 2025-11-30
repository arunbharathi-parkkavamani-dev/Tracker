import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { sendNotification } from "../utils/notificationService.js";
import { generateNotification } from "../middlewares/notificationMessagePrasher.js";

export default function leaves() {
  return {
    // AFTER CREATE  ➝ Triggered once leave request is newly submitted
    afterCreate: async ({ modelName, docId, userId }) => {
      const leaveDoc = await Leave.findById(docId);
      if (!leaveDoc) return;

      // Notification body for manager
      const requestDetails = {
        leaveName: leaveDoc.leaveName,
        leaveReason: leaveDoc.reason,
      };

      const message = generateNotification(
        leaveDoc.employeeName,
        requestDetails,
        modelName
      );

      // Send notification → Employee ➝ Manager
      await sendNotification({
        recipient: leaveDoc.managerId,
        sender: userId,
        type: 'leave_request',
        title: 'Leave Request',
        message,
        relatedModel: modelName,
        relatedId: leaveDoc._id,
      });
    },

    // BEFORE UPDATE  ➝ Store old status to compare after update
    beforeUpdate: async ({ body, docId }) => {
      if (!docId) return;

      // Fetch previous leave document BEFORE the update happens
      const oldLeave = await Leave.findById(docId).lean();

      // Store old status (Pending → Approved / Approved → Rejected etc.)
      body._oldStatus = oldLeave.status;
    },

    // AFTER UPDATE  ➝ Notification + Leave Deduction + Attendance Creation
    afterUpdate: async ({ modelName, userId, docId, body }) => {
      if (!docId) return;

      const leaveDoc = await Leave.findById(docId);
      const prevStatus = body._oldStatus;
      const newStatus = leaveDoc.status;

      // 🔔 Send notification to employee on every update
      const statusDetails = {
        leaveName: leaveDoc.leaveName,
        leaveStatus: leaveDoc.status,
      };

      const message = generateNotification(
        leaveDoc.employeeName,
        statusDetails,
        modelName
      );

      await sendNotification({
        recipient: leaveDoc.employeeId,
        sender: userId,
        type: 'leave_status',
        title: 'Leave Status Update',
        message,
        relatedModel: modelName,
        relatedId: docId,
      });

      // CASE 1: Pending/Rejected → Approved (NORMAL APPROVAL FLOW)
      if (prevStatus !== "Approved" && newStatus === "Approved") {
        const employee = await Employee.findById(leaveDoc.employeeId);

        const bucket = employee.leaveStatus.find(
          (i) => i.leaveType.toString() === leaveDoc.leaveTypeId.toString()
        );

        // Calculate no. of leave days
        const start = new Date(leaveDoc.startDate);
        const end = new Date(leaveDoc.endDate);
        const oneDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.round((end - start) / oneDay) + 1;

        if (bucket) {
          bucket.usedThisMonth += totalDays;
          bucket.usedThisYear += totalDays;
          bucket.available = Math.max(bucket.available - totalDays, 0); // never negative
        }
        await employee.save();

        // Add attendance for ALL leave days
        const attendance = [];
        let current = new Date(start);
        while (current <= end) {
          attendance.push({
            employee: leaveDoc.employeeId,
            employeeName: leaveDoc.employeeName,
            date: new Date(current),
            status: "Leave",
            leaveType: leaveDoc.leaveType,
            managerId: userId,
          });
          current.setDate(current.getDate() + 1);
        }
        await Attendance.insertMany(attendance);
        return;
      }

      // CASE 2: Approved → Rejected/Cancelled (ROLLBACK FLOW)
      if (prevStatus === "Approved" && newStatus === "Rejected") {
        const employee = await Employee.findById(leaveDoc.employeeId);

        const bucket = employee.leaveStatus.find(
          (i) => i.leaveType.toString() === leaveDoc.leaveTypeId.toString()
        );

        // Calculate leave days for rollback
        const start = new Date(leaveDoc.startDate);
        const end = new Date(leaveDoc.endDate);
        const oneDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.round((end - start) / oneDay) + 1;

        if (bucket) {
          // Reverse deductions
          bucket.usedThisMonth = Math.max(bucket.usedThisMonth - totalDays, 0);
          bucket.usedThisYear = Math.max(bucket.usedThisYear - totalDays, 0);
          bucket.available += totalDays; // restore leave balance
        }
        await employee.save();

        // Delete attendance records for that leave period
        await Attendance.deleteMany({
          employee: leaveDoc.employeeId,
          date: { $gte: leaveDoc.startDate, $lte: leaveDoc.endDate },
          status: "Leave",
        });

        return;
      }

      // For other status changes → no action
      return;
    }
  };
}
