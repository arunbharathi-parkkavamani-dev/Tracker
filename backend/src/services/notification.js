// src/services/notification.js
import Notification from "../models/notification.js";
import { emitNotification } from "../utils/socketEmitter.js";

/**
 * Notification Service
 */
export const notificationService = {
  /**
   * Create a notification and emit via socket
   * @param {Object} params
   * @param {string} params.senderId
   * @param {string} params.receiverId
   * @param {string} params.message
   * @param {Object} [params.model] - optional { model: 'Attendance', modelId }
   * @param {string} [params.path] - optional UI navigation path
   */
  create: async ({ senderId, receiverId, message, model, path }) => {
    const notification = await Notification.create({
      sender: senderId,
      receiver: receiverId,
      message,
      meta: model,
      path,
      read: false,
    });

    emitNotification(receiverId, {
      notificationId: notification._id,
      message,
      meta: model,
      path,
      createdAt: notification.createdAt,
    });

    return notification;
  },

  /**
   * Get notifications for a specific user
   * @param {string} receiverId
   * @param {Object} [filter] - optional filters like { read: false }
   */
  read: async (receiverId, filter = {}) => {
    return await Notification.find({ receiver: receiverId, ...filter })
      .sort({ createdAt: -1 })
      .lean();
  },

  /**
   * Mark notification(s) as read
   * @param {Object} filter - e.g., { _id: notificationId } or { receiver: userId, read: false }
   * @param {Object} update - defaults to { read: true }
   */
  update: async (filter, update = { read: true }) => {
    return await Notification.updateMany(filter, update);
  },
};
