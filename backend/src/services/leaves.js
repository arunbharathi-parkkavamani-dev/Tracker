import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import { createAndSendNotification } from "../utils/notificationService.js";
import { generateNotification } from "../middlewares/notificationMessagePrasher.js";

export default function leaves() {
  return {
    // ---------------- AFTER CREATE ----------------
    afterCreate: async ({ modelName, docId, userId }) => {
      const leavesDoc = await Leave.findById(docId);
      if (!leavesDoc) return;

      const request = {
        leaveName: leavesDoc.leaveName,
        leaveReason: leavesDoc.reason,
      };
      const message = generateNotification(
        leavesDoc.employeeName,
        request,
        modelName
      );
      await createAndSendNotification({
        senderId: userId,
        receiverId: leavesDoc.managerId,
        message,
        model: { model: modelName, modelId: leavesDoc._id },
      });
    },

    afterUpdate: async ({ modelName, userId, docId }) => {
      if (!docId) return;

      const leaveDoc = await Leave.findById(docId)

      const request = {
        leaveName: leaveDoc.leaveName,
      };

      const message = generateNotification(
        leaveDoc.employeeName,
        request,
        leaveDoc.status,
        modelName
      );

      await createAndSendNotification({
        senderId: userId,
        receiverId: leaveDoc.employeeId,
        message,
        model: { model: modelName, modelId: docId },
      });



      if (body?.status === "Approval") {
        const payload = {
          employee : body.employeeId,
          employeeName : body.employeeName,
          date : body.startDate,
          status : "Leave",
          leaveType : body.leaveType,
          managerId : userId
        }
        const data = new Attendance(payload)
        return data;
      }

      if(body?.status === "Rejected") return;
    },
  };
}
