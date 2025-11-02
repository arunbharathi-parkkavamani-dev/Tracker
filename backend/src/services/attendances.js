import Attendance from "../models/Attendance.js";
import { createAndSendNotification } from "../utils/notificationService.js";
import { generateAttendanceNotification } from "../middlewares/notificationMessagePrasher.js";

/**
 * Attendance Service
 * Handles both create & update business logic
 */
export default function attendances() {
  return {
    create: async ({ role, userId, body, docId }) => {
      const today = body.date ? new Date(body.date) : new Date();

      const canModify = (employeeId) => {
        const isSelf = String(employeeId) === String(userId);
        return (role === "manager" && !isSelf && body.status === "Leave") || isSelf;
      };

      const maybeNotify = async (attendanceDoc) => {
        const request = body.status || attendanceDoc.status;
        if (request === "Present" || request === "Check-Out") return;
        if (request) {
          const message = generateAttendanceNotification(attendanceDoc.employeeName, attendanceDoc.request);
          await createAndSendNotification({
            senderId: userId,
            receiverId: attendanceDoc.managerId || body.managerId,
            message,
            model: { model: "Attendance", modelId: attendanceDoc._id },
          });
        }
      };

      if (!docId) {
        if (!canModify(body.employee)) throw new Error("Not allowed to create this attendance record");

        const isSunday = today.getDay() === 0;

        if (isSunday || (role === "developer" && !body.alternative)) {
          body.request = body.status;
          body.status = "Pending";
        } else {
          if (body.workType === "fixed") {
            const checkIn = new Date(body.checkIn);
            const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
            const cutOff = 10 * 60 + 20;
            body.status = checkInMinutes > cutOff ? "Late Entry" : "Check-In";
          } else {
            body.status = "Present";
          }
        }

        const attendance = new Attendance({
          ...body,
          employee: body.employee || userId,
          employeeName: body.employeeName,
          date: today,
          checkIn: body.checkIn || new Date(),
        });

        const savedAttendance = await attendance.save();
        await maybeNotify(savedAttendance);
        return savedAttendance;
      }
    },

    update: async ({ role, userId, body, docId }) => {
      const attendanceDoc = await Attendance.findById(docId);
      if (!attendanceDoc) throw new Error("Attendance record not found");

      const canModify = (employeeId) => {
        const isSelf = String(employeeId) === String(userId);
        return (role === "manager" && !isSelf && body.status === "Leave") || isSelf;
      };

      if (!canModify(attendanceDoc.employee)) throw new Error("Not allowed to update this attendance record");

      const checkIn = new Date(attendanceDoc.checkIn);
      const checkOut = body.checkOut ? new Date(body.checkOut) : null;
      if (!checkOut) throw new Error("Check-out time required");

      const isMale = body.gender === "male";
      const workedMinutes = (checkOut - checkIn) / (1000 * 60);
      const femaleWorkingTime = workedMinutes >= 7.5 * 60;
      const maleWorkingTime = workedMinutes >= 8.5 * 60;
      const femaleCutOff = 18 * 60 + 30;
      const maleCutOff = 19 * 60 + 30;

      body.status =
        (!isMale && (!femaleWorkingTime || checkOut.getHours() * 60 + checkOut.getMinutes() < femaleCutOff)) ||
        (isMale && (!maleWorkingTime || checkOut.getHours() * 60 + checkOut.getMinutes() < maleCutOff))
          ? "Early check-out"
          : "Check-Out";

      Object.assign(attendanceDoc, body);
      const updatedAttendance = await attendanceDoc.save();

      await createAndSendNotification({
        senderId: userId,
        receiverId: attendanceDoc.managerId || body.managerId,
        message: generateAttendanceNotification(attendanceDoc.employeeName, attendanceDoc.status),
        model: { model: "Attendance", modelId: attendanceDoc._id },
      });

      return updatedAttendance;
    },
  };
}
