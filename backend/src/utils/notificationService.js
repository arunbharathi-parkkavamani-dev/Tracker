import { io } from "../index.js";
import Notification from "../models/notification.js";

export const sendNotification = async ({ 
  recipient, 
  sender, 
  type, 
  title, 
  message, 
  relatedModel, 
  relatedId 
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedModel,
      relatedId,
      read: false
    });

    // Send real-time notification via Socket.IO
    io.to(recipient.toString()).emit('notification', {
      id: notification._id,
      type,
      title,
      message,
      createdAt: notification.createdAt
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyTaskUpdate = async (taskId, updatedBy, updateType, details) => {
  try {
    const Task = (await import("../models/Tasks.js")).default;
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'basicInfo.firstName basicInfo.lastName')
      .populate('createdBy', 'basicInfo.firstName basicInfo.lastName')
      .populate('followers', 'basicInfo.firstName basicInfo.lastName');

    if (!task) return;

    const recipients = new Set();
    
    // Add assignees
    task.assignedTo?.forEach(user => recipients.add(user._id.toString()));
    
    // Add creator
    if (task.createdBy) recipients.add(task.createdBy._id.toString());
    
    // Add followers
    task.followers?.forEach(user => recipients.add(user._id.toString()));
    
    // Remove the person who made the update
    recipients.delete(updatedBy.toString());

    const notifications = Array.from(recipients).map(recipientId => 
      sendNotification({
        recipient: recipientId,
        sender: updatedBy,
        type: 'task_update',
        title: `Task Updated: ${task.title}`,
        message: details,
        relatedModel: 'tasks',
        relatedId: taskId
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending task notifications:', error);
  }
};