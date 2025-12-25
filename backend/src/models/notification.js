// models/notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employees",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employees",
    required: true
  },
  message: { type: String, required: true },
  meta: {
    model: { type: String, index: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, index: true },
  },
  path: { type: String },
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { 
  timestamps: true,
  expireAfterSeconds: 90 * 24 * 60 * 60 // Auto-delete after 90 days
});

// Compound indexes for notification queries
notificationSchema.index({ receiver: 1, read: 1, createdAt: -1 }); // Unread notifications
notificationSchema.index({ receiver: 1, priority: 1, createdAt: -1 }); // Priority notifications
notificationSchema.index({ sender: 1, createdAt: -1 }); // Sent notifications
notificationSchema.index({ "meta.model": 1, "meta.modelId": 1 }); // Related entity notifications
notificationSchema.index({ createdAt: -1 }); // Recent notifications

export default mongoose.model("notifications", notificationSchema);
