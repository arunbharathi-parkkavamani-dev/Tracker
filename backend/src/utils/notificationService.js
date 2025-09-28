// src/utils/notificationService.js
import Notification from "../models/Notification.js";
import { emitNotification } from "./socket.js";

/**
 * Create a notification in DB and emit it via socket
 * @param {object} params
 * @param {string} params.senderId
 * @param {string} params.receiverId
 * @param {string} params.message
 * @param {object} params.model - related model info { model: "Attendance", modelId }
 */
export const createAndSendNotification = async ({
  senderId,
  receiverId,
  message,
  model,
}) => {
  const notification = await Notification.create({
    sender: senderId,
    receiver: receiverId,
    message,
    meta: model,
    read: false,
  });

  emitNotification(receiverId, {
    notificationId: notification._id,
    message,
    meta: model,
    createdAt: notification.createdAt,
  });

  return notification;
};
