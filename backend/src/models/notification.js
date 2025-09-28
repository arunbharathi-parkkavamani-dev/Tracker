// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: true },
  reportingManger:{ type: mongoose.Schema.Types.ObjectId, ref: "employees" },
  message: { type: String, required: true },
  meta: { type: Object }, // optional, e.g., attendanceId
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
