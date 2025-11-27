// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employees",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employees",
    required: true,
  },
  message: { type: String, required: true },
  meta: {
    model: { type: String }, // e.g., 'attendances', 'leaveRequests'
    modelId: { type: mongoose.Schema.Types.ObjectId },
  },
  path: { type: String }, // UI navigation path
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Check if model exists before compiling
export default mongoose.models.Notification ||
  mongoose.model("notifications", notificationSchema);
