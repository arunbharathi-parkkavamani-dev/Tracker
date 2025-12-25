import asyncNotificationService from './asyncNotificationService.js';

// Convert ticket to task
export const convertToTask = async (ticketId, convertedBy, taskData) => {
  const { default: models } = await import('../models/Collection.js');
  const session = await models.tickets.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Get ticket
      const ticket = await models.tickets.findById(ticketId).session(session);
      if (!ticket) throw new Error('Ticket not found');
      
      if (ticket.isConvertedToTask) {
        throw new Error('Ticket already converted to task');
      }
      
      // Create task from ticket
      const task = await models.tasks.create([{
        title: ticket.title,
        userStory: ticket.description,
        priorityLevel: ticket.priority,
        createdBy: convertedBy,
        assignedTo: ticket.assignedTo ? [ticket.assignedTo] : [],
        linkedTicketId: ticket._id,
        isFromTicket: true,
        ...taskData
      }], { session });
      
      // Update ticket
      await models.tickets.findByIdAndUpdate(ticketId, {
        linkedTaskId: task[0]._id,
        isConvertedToTask: true,
        convertedBy,
        convertedAt: new Date(),
        $push: {
          comments: {
            comment: `Ticket converted to development task: ${task[0]._id}`,
            commentedBy: convertedBy,
            commentedAt: new Date()
          }
        }
      }, { session });
      
      // Notify stakeholders
      await notifyTicketConversion(ticket, task[0], convertedBy);
      
      return { ticket, task: task[0] };
    });
  } finally {
    await session.endSession();
  }
};

// Check synchronization status
export const checkSyncStatus = async (ticketId, taskId) => {
  const { default: models } = await import('../models/Collection.js');
  
  try {
    const [ticket, task] = await Promise.all([
      models.tickets.findById(ticketId),
      models.tasks.findById(taskId)
    ]);
    
    return {
      isLinked: ticket?.linkedTaskId?.toString() === taskId && task?.linkedTicketId?.toString() === ticketId,
      ticketStatus: ticket?.status,
      taskStatus: task?.status,
      lastSync: Math.max(ticket?.updatedAt || 0, task?.updatedAt || 0),
      syncHealth: ticket?.status === getExpectedTicketStatus(task?.status)
    };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return { isLinked: false, error: error.message };
  }
};

// Get linked data
export const getTicketWithTask = async (ticketId) => {
  const { default: models } = await import('../models/Collection.js');
  
  return await models.tickets.findById(ticketId)
    .populate('linkedTaskId', 'title status assignedTo progress')
    .populate('assignedTo', 'basicInfo.firstName basicInfo.lastName')
    .populate('createdBy', 'basicInfo.firstName basicInfo.lastName');
};

// Helper functions
function getExpectedTicketStatus(taskStatus) {
  const statusMapping = {
    'To Do': 'Open',
    'In Progress': 'In Progress', 
    'In Review': 'In Progress',
    'Completed': 'Resolved',
    'Approved': 'Resolved'
  };
  return statusMapping[taskStatus];
}

async function notifyTicketConversion(ticket, task, convertedBy) {
  try {
    // Notify ticket creator
    if (ticket.createdBy.toString() !== convertedBy.toString()) {
      await asyncNotificationService.queuePushNotification(
        ticket.createdBy,
        'Ticket Converted',
        `Your ticket ${ticket.ticketId} has been converted to a development task`,
        { ticketId: ticket._id, taskId: task._id }
      );
    }
    
    // Notify assigned developer
    if (task.assignedTo && task.assignedTo.length > 0) {
      await asyncNotificationService.queuePushNotification(
        task.assignedTo[0],
        'New Development Task',
        `New task assigned from ticket ${ticket.ticketId}: ${task.title}`,
        { ticketId: ticket._id, taskId: task._id }
      );
    }
    
  } catch (error) {
    console.error('Error sending ticket conversion notifications:', error);
  }
}