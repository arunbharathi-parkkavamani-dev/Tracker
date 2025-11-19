import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
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

    // ---------------- BEFOR CREATE ----------------
    beforeUpdate : async ({body, userId, docId}) => {
      if(!docId) return null;
      
      if(body?.status ==="Approved") {
        const data = await Employee.findById(body.employeeId).populate().lean();
        console.log(data);
      }
    },

    // ---------------- AFTER UPDATE ----------------
    afterUpdate: async ({ modelName, userId, docId }) => {
      if (!docId) return;

      const leaveDoc = await Leave.findById(docId)

      const status = {
        leaveName: leaveDoc.leaveName,
        leaveStatus : leaveDoc.status,
      };

      console.log(modelName);

      const message = generateNotification(
        leaveDoc.employeeName,
        status,
        modelName
      );

      await createAndSendNotification({
        senderId: userId,
        receiverId: leaveDoc.employeeId,
        message,
        model: { model: modelName, modelId: docId },
      });



      if (leaveDoc?.status === "Approved") {
        console.log(leaveDoc.status);
        const payload = {
          employee : leaveDoc.employeeId,
          employeeName : leaveDoc.employeeName,
          date : leaveDoc.startDate,
          status : "Leave",
          leaveType : leaveDoc.leaveType,
          managerId : userId
        }
        const data = await Attendance.create(payload);
        return data;
      }

      if(leaveDoc?.status === "Rejected") return;
    },
  };
}
