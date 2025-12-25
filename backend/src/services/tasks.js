import ticketTaskSync from './ticketTaskSync.js';
import asyncNotificationService from './asyncNotificationService.js';

export const beforeCreate = async ({ body, userId }) => {
  // Creator should always be a follower
  body.followers = Array.from(new Set([...(body.followers || []), userId]));
};

export const afterCreate = async ({ modelName, docId, userId }) => {
  try {
    const { default: models } = await import('../models/Collection.js');
    
    const taskDoc = await models.tasks.findById(docId)
      .populate('createdBy', 'basicInfo.firstName basicInfo.lastName')
      .populate('assignedTo', 'basicInfo.firstName basicInfo.lastName');
    
    if (!taskDoc) return;
    
    const creatorName = `${taskDoc.createdBy?.basicInfo?.firstName || ''} ${taskDoc.createdBy?.basicInfo?.lastName || ''}`.trim() || 'User';
    
    // Create comment thread
    const thread = await models.commentsthreads.create({
      taskId: taskDoc._id.toString(),
      comments: [{
        commentedBy: userId,
        message: `Task created by ${creatorName}`
      }]
    });
    
    taskDoc.commentsThread = thread._id;
    await taskDoc.save();
    
    // Notify assigned users
    if (taskDoc.assignedTo?.length) {
      for (const assignee of taskDoc.assignedTo) {
        if (assignee._id.toString() === userId.toString()) continue;
        
        await asyncNotificationService.queuePushNotification(
          assignee._id,
          'Task Assignment',
          `New task assigned: ${taskDoc.title}`,
          { taskId: docId, type: 'task_assignment' }
        );
      }
    }
    
  } catch (error) {
    console.error('Task afterCreate error:', error);
  }
};

export const beforeUpdate = async ({ body, docId }) => {
  const { default: models } = await import('../models/Collection.js');
  const oldDoc = await models.tasks.findById(docId).lean();
  if (!oldDoc) return;
  
  body._oldStatus = oldDoc.status;
  body._oldAssignedTo = oldDoc.assignedTo || [];
};

export const afterUpdate = async (taskData, updateData, userId) => {
  try {
    const { default: models } = await import('../models/Collection.js');
    
    // Sync to linked ticket
    if (updateData.status && taskData.linkedTicketId) {
      await ticketTaskSync.syncTaskStatusToTicket(
        taskData._id, 
        updateData.status, 
        userId
      );
    }
    
    if (updateData.assignedTo && taskData.linkedTicketId) {
      await ticketTaskSync.syncTaskAssignmentToTicket(
        taskData._id, 
        updateData.assignedTo, 
        userId
      );
    }
    
    // Get full task data
    const taskDoc = await models.tasks.findById(taskData._id)
      .populate('assignedTo', 'basicInfo.firstName basicInfo.lastName')
      .populate('followers', 'basicInfo.firstName basicInfo.lastName');
    
    const updater = await models.employees.findById(userId)
      .select('basicInfo.firstName basicInfo.lastName');
    
    const updaterName = `${updater?.basicInfo?.firstName || ''} ${updater?.basicInfo?.lastName || ''}`.trim() || 'User';
    
    // Handle comment addition
    if (updateData._isComment) {
      const commentText = updateData._commentText || '';
      const mentioned = (updateData._mentionedUserIds || []).map(String);
      
      // Add comment to thread
      await models.commentsthreads.updateOne(
        { _id: taskDoc.commentsThread },
        {
          $push: {
            comments: {
              commentedBy: userId,
              message: commentText,
              mentions: mentioned
            }
          }
        }
      );
      
      // Notify users
      const notifyUsers = new Set([
        ...(taskDoc.assignedTo || []).map(u => u._id.toString()),
        ...(taskDoc.followers || []).map(u => u._id.toString()),
        ...mentioned
      ]);
      
      for (const receiverId of notifyUsers) {
        if (receiverId === userId.toString()) continue;
        
        await asyncNotificationService.queuePushNotification(
          receiverId,
          'Task Comment',
          `${updaterName} commented: ${commentText.substring(0, 50)}...`,
          { taskId: taskData._id, type: 'task_comment' }
        );
      }
      
      return;
    }
    
    // Handle status change
    if (updateData._oldStatus && updateData._oldStatus !== taskDoc.status) {
      const notifyUsers = new Set([
        ...(taskDoc.assignedTo || []).map(u => u._id.toString()),
        ...(taskDoc.followers || []).map(u => u._id.toString())
      ]);
      
      for (const receiverId of notifyUsers) {
        if (receiverId === userId.toString()) continue;
        
        await asyncNotificationService.queuePushNotification(
          receiverId,
          'Task Status Update',
          `${updaterName} changed task status to ${taskDoc.status}`,
          { taskId: taskData._id, type: 'task_status' }
        );
      }
    }
    
    // Handle new assignments
    const oldAssigned = (updateData._oldAssignedTo || []).map(String);
    const newAssigned = (taskDoc.assignedTo || []).map(u => u._id.toString());
    const addedAssignees = newAssigned.filter(id => !oldAssigned.includes(id));
    
    if (addedAssignees.length) {
      for (const receiverId of addedAssignees) {
        if (receiverId === userId.toString()) continue;
        
        await asyncNotificationService.queuePushNotification(
          receiverId,
          'New Task Assignment',
          `${updaterName} assigned you to task: ${taskDoc.title}`,
          { taskId: taskData._id, type: 'task_assignment' }
        );
      }
      
      // Auto-follow new assignees
      const followersSet = new Set((taskDoc.followers || []).map(u => u._id.toString()));
      const newFollowers = addedAssignees.filter(id => !followersSet.has(id));
      
      if (newFollowers.length) {
        await models.tasks.findByIdAndUpdate(taskData._id, {
          $addToSet: { followers: { $each: newFollowers } }
        });
      }
    }
    
  } catch (error) {
    console.error('Task afterUpdate error:', error);
  }
};