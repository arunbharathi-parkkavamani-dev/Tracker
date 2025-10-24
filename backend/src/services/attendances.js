import Attendance from "../models/Attendance.js";
import { createAndSendNotification } from "../utils/notificationService.js";
import { generateAttendanceNotification } from "../middlewares/notificationMessagePrasher.js";

/**
 * Attendance Service
 * Handles both create & update business logic
 */
export default async function attendanceService({ role, userId, body, docId }) {
  const today = body.date ? new Date(body.date) : new Date();
  
  // -------- CREATE --------
  if (!docId) {
    console.log("running without ID")
    const isSelf = String(body.employee) === String(userId);
    let allowed = false;

    if (role === "manager" && !isSelf && body.status === "Leave") allowed = true;
    if (isSelf) allowed = true;

    if (!allowed) throw new Error("Not allowed to create this attendance record");

    const isSunday = today.getDay() === 0;

    if (isSunday || (role === "developer" && !body.alternative)) {
      const request = body.status;
      body.status = "Pending";
      body.request = request;

      const message = generateAttendanceNotification(body.name, request);
      await createAndSendNotification({
        senderId: userId,
        receiverId: body.managerId,
        employeeName: body.employeeName,
        message,
        model: { model: "Attendance", modelId: null },
      });
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

    return await attendance.save();
  }

  // -------- UPDATE --------
  const attendanceDoc = await Attendance.findById(docId);
  if (!attendanceDoc) throw new Error("Attendance record not found");

  const isSelf = String(attendanceDoc.employee) === String(userId);
  let allowed = false;
  if (role === "manager" && !isSelf && body.status === "Leave") allowed = true;
  if (isSelf) allowed = true;

  if (!allowed) throw new Error("Not allowed to update this attendance record");

  const checkIn = new Date(attendanceDoc.checkIn);
  const checkOut = body.checkOut ? new Date(body.checkOut) : null;
  if (!checkOut) throw new Error("Check-out time required");

  const isMale = body.gender === "male";
  const workedMinutes = (checkOut - checkIn) / (1000 * 60);
  const femaleWorkingTime = workedMinutes >= 7.5 * 60;
  const maleWorkingTime = workedMinutes >= 8.5 * 60;

  const femaleCutOff = 18 * 60 + 30;
  const maleCutOff = 19 * 60 + 30;

  if (
    (!isMale && (!femaleWorkingTime || checkOut.getHours() * 60 + checkOut.getMinutes() < femaleCutOff)) ||
    (isMale && (!maleWorkingTime || checkOut.getHours() * 60 + checkOut.getMinutes() < maleCutOff))
  ) {
    body.status = "Early check-out";
  } else {
    body.status = "Check-Out";
  }

  Object.assign(attendanceDoc, body);
  return await attendanceDoc.save();
}
