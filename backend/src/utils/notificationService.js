import { io, activeConnections } from "../index.js";
import notification from "../models/notification.js";
import session from "../models/Session.js";
import { sendPush } from "../utils/pushSender.js";

// Optimized notification service with memory management
export const sendNotification = async ({
  receiver,
  sender,
  message,
  meta,
  path,
}) => {
  try {
    // 1️⃣ Save notification in DB (source of truth)
    const newNotification = await notification.create({
      sender,
      receiver,
      message,
      meta,
      path,
      read: false,
    });

    // 2️⃣ Optimized Socket.io delivery
    const receiverStr = receiver.toString();
    const socketsInRoom = await io.in(receiverStr).fetchSockets();
    
    if (socketsInRoom.length > 0) {
      // Send to specific room with minimal payload
      io.to(receiverStr).emit("notification", {
        id: newNotification._id,
        message,
        createdAt: newNotification.createdAt,
        sender: sender.toString()
      });
    }

    // 3️⃣ Optimized push notification (only if user offline)
    if (socketsInRoom.length === 0) {
      // User is offline, send push notification
      const userSessions = await session.find({
        userId: receiver,
        status: "Active",
        fcmToken: { $ne: null },
        lastUsedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Active in last 24h
      }).select('fcmToken').lean();

      // Batch push notifications
      const pushPromises = userSessions.map(session => 
        sendPush({
          pushToken: session.fcmToken,
          title: "New Notification",
          body: message,
          data: {
            path,
            model: meta?.model,
            notificationId: newNotification._id.toString()
          },
        })
      );
      
      // Send all push notifications concurrently
      await Promise.allSettled(pushPromises);
    }

    return newNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Optimized task notification with batching
export const notifyTaskUpdate = async (
  taskId,
  updatedBy,
  updateType,
  details
) => {
  try {
    const Task = (await import("../models/Tasks.js")).default;
    const task = await Task.findById(taskId)
      .select('assignedTo createdBy followers title')
      .populate('assignedTo', 'basicInfo.firstName basicInfo.lastName')
      .populate('createdBy', 'basicInfo.firstName basicInfo.lastName')
      .populate('followers', 'basicInfo.firstName basicInfo.lastName')
      .lean();

    if (!task) return;

    const recipients = new Set();

    // Collect all recipients
    task.assignedTo?.forEach((u) => recipients.add(u._id.toString()));
    if (task.createdBy) recipients.add(task.createdBy._id.toString());
    task.followers?.forEach((u) => recipients.add(u._id.toString()));

    // Remove the user who made the update
    recipients.delete(updatedBy.toString());

    if (recipients.size === 0) return;

    // Batch create notifications
    const notificationDocs = Array.from(recipients).map(receiverId => ({
      receiver: receiverId,
      sender: updatedBy,
      message: details,
      meta: {
        model: "tasks",
        modelId: taskId,
      },
      path: `/tasks/${taskId}`,
      read: false
    }));

    // Bulk insert notifications
    const createdNotifications = await notification.insertMany(notificationDocs);

    // Batch socket emissions
    const socketPromises = Array.from(recipients).map(async (receiverId) => {
      const socketsInRoom = await io.in(receiverId).fetchSockets();
      if (socketsInRoom.length > 0) {
        io.to(receiverId).emit("taskUpdate", {
          taskId,
          message: details,
          updatedBy,
          timestamp: Date.now()
        });
      }
    });

    await Promise.allSettled(socketPromises);

    return createdNotifications;
  } catch (error) {
    console.error("Error sending task notifications:", error);
    throw error;
  }
};
