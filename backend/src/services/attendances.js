import Attendance from "../models/Attendance.js";
import { sendNotification } from "../utils/notificationService.js";
import { generateNotification } from "../middlewares/notificationMessagePrasher.js";

/**
 * Attendance Service
 * Handles create + update lifecycle
 */
export default function attendances() {
  return {
    // ---------------- BEFORE CREATE ----------------
    beforeCreate: async ({ userId, body, designation }) => {
      const today = new Date();
      const isSunday = today.getDay() === 0;
      const isSaturday = today.getDay() === 6;

      let isAlternative = false;

      // Check alternate Saturday logic
      if (isSaturday) {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const lastWeekIso = lastWeek.toISOString().split("T")[0];

        const lastSatAttendance = await Attendance.findOne({
          employee: userId,
          checkIn: {
            $gte: new Date(`${lastWeekIso}T00:00:00Z`),
            $lte: new Date(`${lastWeekIso}T23:59:59Z`),
          },
        });

        isAlternative = !!lastSatAttendance;
      }

      // Sunday OR Developer & alt Saturday → set request workflow
      if (
        isSunday ||
        (designation?.toLowerCase() === "developer" && isAlternative)
      ) {
        body.request = body.status;
        body.status = "Pending";
      } else {
        // Normal attendance logic
        if (body.workType === "fixed") {
          const checkIn = new Date(body.checkIn);
          const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
          const cutOff = 10 * 60 + 20; // 10:20 AM
          body.status = checkInMinutes > cutOff ? "Late Entry" : "Present";
        } else {
          body.status = "Present";
        }
      }

      return body;
    },

    // ---------------- AFTER CREATE ----------------
    afterCreate: async ({ modelName, body, docId, userId }) => {
      const attendanceDoc = await Attendance.findById(docId);
      if (!attendanceDoc) return;

      const request = attendanceDoc.status;

      // Skip for these statuses
      if (["Present", "Check-Out", "Check-In"].includes(request)) return;

      const message = generateNotification(
        attendanceDoc.employeeName,
        request,
        modelName
      );

      const receiverId = attendanceDoc.managerId;
      if (!receiverId) {
        return;
      }
      await sendNotification({
        sender: userId,
        receiver: receiverId,
        type: 'attendance_request',
        title: 'Attendance Request',
        message,
        relatedModel: 'Attendance',
        relatedId: attendanceDoc._id,
      });
    },

    // ---------------- BEFORE UPDATE ----------------
    beforeUpdate: async ({ body, docId }) => {
      const attendanceDoc = await Attendance.findById(docId);
      if (!attendanceDoc) return;

      const checkIn = new Date(attendanceDoc.checkIn);
      const checkOut = body.checkOut ? new Date(body.checkOut) : null;
      if (!checkOut) throw new Error("Check-out time required");

      const isMale = attendanceDoc.gender === "male";
      const workedMinutes = (checkOut - checkIn) / (1000 * 60);

      const femaleWorkingTime = workedMinutes >= 7.5 * 60;
      const maleWorkingTime = workedMinutes >= 8.5 * 60;

      const checkOutMinutes = checkOut.getHours() * 60 + checkOut.getMinutes();
      const femaleCutOff = 18 * 60 + 30; // 6:30 PM
      const maleCutOff = 19 * 60 + 30; // 7:30 PM

      const isEarly =
        (!isMale && (!femaleWorkingTime || checkOutMinutes < femaleCutOff)) ||
        (isMale && (!maleWorkingTime || checkOutMinutes < maleCutOff));

      body.status = isEarly ? "Early check-out" : "Check-Out";
      return body;
    },

    // ---------------- AFTER UPDATE ----------------
    afterUpdate: async ({ modelName, userId, body, docId }) => {
      const attendanceDoc = await Attendance.findById(docId);
      if (!attendanceDoc) return;

      const request = attendanceDoc.request || attendanceDoc.status;
      if (["Present", "Check-Out", "Check-In"].includes(request)) return;

      const message = generateNotification(
        attendanceDoc.employeeName,
        request,
        modelName
      );
      await sendNotification({
        recipient: attendanceDoc.managerId || body.managerId,
        sender: userId,
        type: 'attendance_request',
        title: 'Attendance Request',
        message,
        relatedModel: 'Attendance',
        relatedId: attendanceDoc._id,
      });
    },
  };
}
