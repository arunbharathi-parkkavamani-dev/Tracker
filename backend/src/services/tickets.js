export default function tickets() {
  return {
    // ---------------- Before Create ----------------
    beforeCreate: async ({ body, userId }) => {
      // Handle agent ticket creation
      if (body.agentId) {
        const { default: models } = await import('../models/Collection.js');

        // Get agent and set client info
        const agent = await models.agents.findById(body.agentId).populate('client');
        if (agent && agent.client) {
          body.clientId = agent.client._id;
          body.createdBy = body.agentId;
          body.createdByModel = 'agents';
        }

        // Remove agentId from body as it's not a ticket field
        delete body.agentId;
      }
    },

    // ---------------- After Create ----------------
    afterCreate: async ({ docId, userId }) => {
      try {
        const { default: models } = await import('../models/Collection.js');
        const { default: fcmService } = await import('./fcmService.js');

        const ticket = await models.tickets.findById(docId)
          .populate('createdBy', 'basicInfo.firstName basicInfo.lastName')
          .lean();

        if (!ticket) return;

        const creatorName = `${ticket.createdBy?.basicInfo?.firstName || ''} ${ticket.createdBy?.basicInfo?.lastName || ''}`.trim() || 'Someone';

        // Notify all assigned employees
        if (ticket.assignedTo && ticket.assignedTo.length > 0) {
          await fcmService.dispatchNotification({
            type: 'ticket_assigned',
            title: 'New Ticket Assigned',
            message: `${creatorName} assigned you a new ticket: ${ticket.title || ticket.ticketId || 'Untitled'}`,
            sender: userId,
            meta: { model: 'tickets', modelId: docId },
            receiversArray: ticket.assignedTo
          });
        }
      } catch (error) {
        console.error('[tickets service] afterCreate FCM error:', error);
      }
    },

    // ---------------- Before Update ----------------
    beforeUpdate: async ({ userId, body, docId }) => {
      if (body.pushTaskSync === true) {
        const { default: models } = await import('../models/Collection.js');
        const existingDoc = await models.tickets.findById(docId);

        if (!existingDoc.isConvertedToTask) {

          // Ensure taskTypeId
          if (!existingDoc.taskTypeId) {
            const defaultTaskType = await models.tasktypes.findOne();
            if (!defaultTaskType) {
              throw new Error('No task type available.');
            }
            await models.tickets.findByIdAndUpdate(docId, {
              taskTypeId: defaultTaskType._id
            });
          }

          // ✅ Ensure projectTypeId
          if (!existingDoc.projectTypeId) {
            const defaultProjectType = await models.projecttypes.findOne();
            if (!defaultProjectType) {
              throw new Error('No project type available.');
            }
            await models.tickets.findByIdAndUpdate(docId, {
              projectTypeId: defaultProjectType._id
            });
          }

          body.isConvertedToTask = true;
          body.convertedBy = userId;
          body.convertedAt = new Date();
        }
      }
    },

    // ---------------- After Update ----------------
    afterUpdate: async ({ userId, docId, body }) => {
      if (body.pushTaskSync === true) {
        const { default: models } = await import('../models/Collection.js');
        const ticketData = await models.tickets.findById(docId);

        if (!ticketData.linkedTaskId) {
          const taskData = await models.tasks.create({
            clientId: ticketData.clientId,
            projectTypeId: ticketData.projectTypeId,
            taskTypeId: ticketData.taskTypeId,
            createdBy: ticketData.createdBy,
            assignedTo: ticketData.assignedTo || [],
            linkedTicketId: ticketData._id,
            isFromTicket: true,
            title: ticketData.title,
            userStory: ticketData.userStory, // Use userStory field
            priorityLevel: ticketData.priority,
            status: 'To Do',
            followers: [userId]
          });

          // Create comment thread
          const thread = await models.commentsthreads.create({
            taskId: taskData._id.toString(),
            comments: [{
              commentedBy: userId,
              message: `Task created from ticket conversion`
            }]
          });

          taskData.commentsThread = thread._id;
          await taskData.save();

          // Update ticket with task link
          await models.tickets.findByIdAndUpdate(docId, {
            linkedTaskId: taskData._id
          });

          // Send notifications
          await notifyTicketConversion(ticketData, taskData, userId);
        }
      }
    }
  };
}

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
    const { default: fcmService } = await import('./fcmService.js');

    // Notify ticket creator if they didn't do the conversion themselves
    if (ticket.createdBy.toString() !== convertedBy.toString()) {
      await fcmService.dispatchNotification({
        type: 'ticket_converted',
        title: 'Ticket Converted to Task',
        message: `Your ticket ${ticket.ticketId || ticket.title} has been converted to a development task.`,
        sender: convertedBy,
        meta: { model: 'tickets', modelId: ticket._id },
        receiversArray: [ticket.createdBy]
      });
    }

    // Notify all assigned developers on the new task
    if (task.assignedTo && task.assignedTo.length > 0) {
      await fcmService.dispatchNotification({
        type: 'task_assigned',
        title: 'New Development Task Assigned',
        message: `New task from ticket ${ticket.ticketId || ''}: ${task.title}`,
        sender: convertedBy,
        meta: { model: 'tasks', modelId: task._id },
        receiversArray: task.assignedTo
      });
    }

  } catch (error) {
    console.error('[tickets service] notifyTicketConversion FCM error:', error);
  }
}