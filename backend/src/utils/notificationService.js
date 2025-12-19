import { io } from "../index.js";
import notification from "../models/notification.js";
import session from "../models/Session.js";
import { sendPush } from "../utils/pushSender.js";

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

    // 2️⃣ Socket.IO (real-time UI)
    io.to(receiver.toString()).emit("notification", {
      id: newNotification._id,
      message,
      createdAt: newNotification.createdAt,
    });

    // 3️⃣ Push notification (system alert)
    const userSessions = await session.find({
      userId: receiver,
      status: "Active",
      fcmToken: { $ne: null },
    });

    for (const session of userSessions) {
      await sendPush({
        pushToken: session.fcmToken,
        title: "New Notification",
        body: message,
        data: {
          path,
          model: meta?.model,
        },
      });
    }

    return newNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const notifyTaskUpdate = async (
  taskId,
  updatedBy,
  updateType,
  details
) => {
  try {
    const Task = (await import("../models/Tasks.js")).default;
    const task = await Task.findById(taskId)
      .populate("assignedTo", "basicInfo.firstName basicInfo.lastName")
      .populate("createdBy", "basicInfo.firstName basicInfo.lastName")
      .populate("followers", "basicInfo.firstName basicInfo.lastName");

    if (!task) return;

    const recipients = new Set();

    task.assignedTo?.forEach((u) => recipients.add(u._id.toString()));
    if (task.createdBy) recipients.add(task.createdBy._id.toString());
    task.followers?.forEach((u) => recipients.add(u._id.toString()));

    recipients.delete(updatedBy.toString());

    const notifications = Array.from(recipients).map((receiverId) =>
      sendNotification({
        receiver: receiverId,
        sender: updatedBy,
        message: details,
        meta: {
          model: "tasks",
          modelId: taskId,
        },
        path: `/tasks/${taskId}`,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error sending task notifications:", error);
  }
};
