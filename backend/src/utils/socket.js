// src/utils/socketEmitter.js
import { io } from "../index.js"; // adjust path to your index.js

/**
 * Emit a notification to a specific user (receiver)
 * @param {string} receiverId - User ID to send notification
 * @param {object} payload - Data to send
 */
export const emitNotification = (receiverId, payload) => {
  if (!receiverId) return;
  io.to(receiverId.toString()).emit("notification", payload);
};
