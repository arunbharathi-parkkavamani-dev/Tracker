export default function tickets() {
  return {
    // ---------------- Before Create ----------------
    beforeCreate: async ({ body, userId }) => {
      const { default: models } = await import('../models/Collection.js');

      // Auto-set default task type if not provided
      if (!body.type) {
        const defaultTaskType = await models.tasktypes.findOne();
        if (defaultTaskType) {
          body.type = defaultTaskType._id;
        }
      }

      // Resolve status defaults dynamically from DB config
      try {
        const config = await models.statusconfigs.findOne({ modelName: 'tickets' }).lean();
        if (config) {
          if (!body.status && config.workflowStatuses?.length) {
            const defWorkflow = config.workflowStatuses.find(s => s.isDefault);
            if (defWorkflow) body.status = defWorkflow.key;
          }
          if (!body.metaStatus && config.metaStatuses?.length) {
            const defMeta = config.metaStatuses.find(s => s.isDefault);
            if (defMeta) body.metaStatus = defMeta.key;
          }
        }
      } catch (err) {
        console.error('[TicketService] beforeCreate config error:', err.message);
      }

      // Handle agent ticket creation
      if (body.agentId) {
        // Get agent and set client info
        const agent = await models.agents.findById(body.agentId).populate('client');
        if (agent && agent.client) {
          body.clientId = agent.client._id;
          body.createdBy = body.agentId;
          body.createdByModel = 'agents';
        }

        // Remove agentId from body as it's not a ticket field
        delete body.agentId;
        return;
      }

      // Handle employee-created tickets from the web dashboard
      // Map form objects to model field names
      if (body.clientName?._id) body.clientId = body.clientName._id;
      if (body.product?._id) body.productId = body.product._id;
      if (body.type?._id) body.type = body.type._id;
      if (body.priority?._id) body.priority = body.priority._id || body.priority.name;

      // Extract ObjectIds from assignedTo array
      if (Array.isArray(body.assignedTo)) {
        body.assignedTo = body.assignedTo.map(a => a._id || a);
      }

      // Set createdBy info from session if not already set as agent
      if (body.createdByModel !== 'agents') {
        body.createdBy = userId;
        body.createdByModel = 'employees';
      }

      // description is required in model; fall back to userStory
      if (!body.description && body.userStory) {
        body.description = body.userStory;
      }

      // Clean up mapped fields
      delete body.clientName;
      delete body.product;
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

        // 1. Initialize ticket creator as participant
        await models.ticket_participants.create({
          ticketId: docId,
          userId: ticket.createdBy,
          userModel: ticket.createdByModel,
          role: 'creator'
        });

        // 2. Initialize ticket assignees as participants
        if (ticket.assignedTo && ticket.assignedTo.length > 0) {
          // Deduplicate assignees and filter out the creator
          const uniqueAssignees = [...new Set(ticket.assignedTo.map(uid => uid.toString()))];
          const otherAssigneeIds = uniqueAssignees.filter(uid => uid !== ticket.createdBy.toString());

          if (otherAssigneeIds.length > 0) {
            const assigneeOps = otherAssigneeIds.map(uid => ({
              ticketId: docId,
              userId: uid,
              userModel: 'employees',
              role: 'assignee'
            }));
            await models.ticket_participants.insertMany(assigneeOps);
          }

          const assignmentOps = uniqueAssignees.map(uid => ({
            ticketId: docId,
            assignedTo: uid,
            assignedBy: userId,
            assignedByModel: ticket.createdByModel
          }));
          await models.ticket_assignments.insertMany(assignmentOps);

          // Log assignments in activity log
          for (const uid of uniqueAssignees) {
            await models.ticket_activity_logs.create({
              ticketId: docId,
              action: 'assigned',
              performedBy: userId,
              performedByModel: ticket.createdByModel,
              details: { assignedTo: uid }
            });
          }
        }

        // 3. Initialize ticket status history log
        await models.ticket_status_history.create({
          ticketId: docId,
          toStatus: ticket.status || 'Open',
          changedBy: userId,
          changedByModel: ticket.createdByModel
        });

        // 4. Log ticket creation activity
        await models.ticket_activity_logs.create({
          ticketId: docId,
          action: 'created',
          performedBy: userId,
          performedByModel: ticket.createdByModel,
          details: { initialStatus: ticket.status || 'Open' }
        });

        const creatorName = `${ticket.createdBy?.basicInfo?.firstName || ''} ${ticket.createdBy?.basicInfo?.lastName || ''}`.trim() || 'Someone';

        // Notify all assigned employees
        if (ticket.assignedTo && ticket.assignedTo.length > 0) {
          await fcmService.dispatchTicketNotification({
            type: 'ticket',
            title: 'New Ticket Assigned',
            message: `${creatorName} assigned you a new ticket: ${ticket.title || ticket.ticketId || 'Untitled'}`,
            sender: userId,
            meta: { model: 'tickets', modelId: docId },
            receiversArray: ticket.assignedTo
          });
        }
      } catch (error) {
        console.error('[tickets service] afterCreate error:', error);
      }
    },

    // ---------------- Before Update ----------------
    beforeUpdate: async ({ role, userId, docId, body, existingDoc }) => {
      // 1. Enforce status transition rules
      const ALLOWED_TRANSITIONS = {
        'New': ['Open', 'Cancelled'],
        'Open': ['In Progress', 'Cancelled'],
        'In Progress': ['Waiting For Client', 'Waiting For Admin', 'Resolved', 'Cancelled'],
        'Waiting For Client': ['In Progress', 'Closed'],
        'Waiting For Admin': ['In Progress', 'Closed'],
        'Resolved': ['Closed', 'Reopened'],
        'Reopened': ['In Progress'],
        'Closed': ['Reopened'],
        'Cancelled': []
      };

      if (body.status && existingDoc && body.status !== existingDoc.status) {
        const allowed = ALLOWED_TRANSITIONS[existingDoc.status] || [];
        const isSuperAdmin = role && (role.toString() === 'Super Admin' || role.toString() === 'superadmin' || role.toString() === '68d8b85df397d1d97620ba90');
        if (!allowed.includes(body.status) && !isSuperAdmin) {
          throw new Error(`⛔ Status transition from "${existingDoc.status}" to "${body.status}" is not allowed.`);
        }
      }

      // Handle comment push (for backward compatibility if legacy code attempts to push)
      if (body.$push?.comments) {
        const { default: models } = await import('../models/Collection.js');
        const commentBody = body.$push.comments;
        await models.ticket_comments.create({
          ticketId: docId,
          commentedBy: userId,
          commenterModel: role?.toString() === 'agent' ? 'agents' : 'employees',
          message: commentBody.message || commentBody.comment || commentBody,
          isPublic: commentBody.isPublic !== undefined ? commentBody.isPublic : true
        });
        delete body.$push;
        return { body };
      }

      // Map assignedTo array of IDs (from detail page assign dropdown)
      if (Array.isArray(body.assignedTo)) {
        body.assignedTo = body.assignedTo.map(a => a._id || a);
      }

      if (body.pushTaskSync === true) {
        const { default: models } = await import('../models/Collection.js');
        const existingTicket = existingDoc || await models.tickets.findById(docId);

        if (existingTicket && !existingTicket.isConvertedToTask) {
          // Ensure taskTypeId
          if (!existingTicket.taskTypeId) {
            const defaultTaskType = await models.tasktypes.findOne();
            if (!defaultTaskType) {
              throw new Error('No task type available.');
            }
            await models.tickets.findByIdAndUpdate(docId, {
              taskTypeId: defaultTaskType._id
            });
          }

          // Ensure projectTypeId
          if (!existingTicket.projectTypeId) {
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
    afterUpdate: async ({ role, userId, docId, data, body, beforeDoc }) => {
      try {
        const { default: models } = await import('../models/Collection.js');
        const { emitTicketEvent } = await import('./ticketSocketEmitter.js');
        const { default: fcmService } = await import('./fcmService.js');

        const commenterModel = role?.toString() === 'agent' ? 'agents' : 'employees';

        // 1. Check if status changed
        if (data.status && beforeDoc && data.status !== beforeDoc.status) {
          const oldStatus = beforeDoc.status;
          const newStatus = data.status;

          // Find the last status history log to update its durationSeconds
          const lastHistory = await models.ticket_status_history.findOne({ ticketId: docId }).sort({ createdAt: -1 });
          if (lastHistory) {
            const durationSeconds = Math.round((Date.now() - new Date(lastHistory.createdAt).getTime()) / 1000);
            await models.ticket_status_history.findByIdAndUpdate(lastHistory._id, { durationSeconds });
          }

          // Create new status history record
          await models.ticket_status_history.create({
            ticketId: docId,
            fromStatus: oldStatus,
            toStatus: newStatus,
            changedBy: userId,
            changedByModel: commenterModel
          });

          // Stamp SLA timestamps on resolution / closure
          if (newStatus === 'Resolved' || newStatus === 'Closed') {
            const tsUpdate = {};
            if (newStatus === 'Resolved') tsUpdate.resolvedAt = new Date();
            if (newStatus === 'Closed')   tsUpdate.closedAt   = new Date();
            await models.tickets.findByIdAndUpdate(docId, tsUpdate);
          }

          // Create activity log
          await models.ticket_activity_logs.create({
            ticketId: docId,
            action: 'status_changed',
            performedBy: userId,
            performedByModel: commenterModel,
            details: { fromStatus: oldStatus, toStatus: newStatus }
          });

          // Emit status change socket event
          await emitTicketEvent(docId, 'status_changed', {
            oldStatus,
            newStatus,
            changedBy: userId,
            changedByModel: commenterModel
          });

          // Notify all participants about status change
          const participants = await models.ticket_participants.find({ ticketId: docId }).lean();
          let receiverIds = participants.map(p => p.userId.toString()).filter(id => id !== userId.toString());
          if (receiverIds.length > 0) {
            await fcmService.dispatchTicketNotification({
              type: 'ticket',
              title: `Ticket Status Updated`,
              message: `Ticket status has been changed from ${oldStatus} to ${newStatus}`,
              sender: userId,
              meta: { model: 'tickets', modelId: docId },
              receiversArray: receiverIds
            });
          }
        }

        // 2. Check if assignees changed
        if (body.assignedTo) {
          const oldAssignees = (beforeDoc?.assignedTo || []).map(id => id.toString());
          const newAssignees = (data.assignedTo || []).map(id => id.toString());

          const added = newAssignees.filter(id => !oldAssignees.includes(id));
          const removed = oldAssignees.filter(id => !newAssignees.includes(id));

          // Handle removals from participants
          if (removed.length > 0) {
            await models.ticket_participants.deleteMany({
              ticketId: docId,
              userId: { $in: removed },
              role: 'assignee'
            });
          }

          // Handle additions
          if (added.length > 0) {
            for (const uid of added) {
              // Add to participants as assignee
              await models.ticket_participants.findOneAndUpdate(
                { ticketId: docId, userId: uid },
                {
                  $setOnInsert: {
                    userModel: 'employees',
                    role: 'assignee'
                  }
                },
                { upsert: true }
              );

              // Log assignment
              await models.ticket_assignments.create({
                ticketId: docId,
                assignedTo: uid,
                assignedBy: userId,
                assignedByModel: commenterModel
              });

              // Create activity log
              await models.ticket_activity_logs.create({
                ticketId: docId,
                action: 'assigned',
                performedBy: userId,
                performedByModel: commenterModel,
                details: { assignedTo: uid }
              });

              // Dispatch notification to assignee
              await fcmService.dispatchTicketNotification({
                type: 'ticket',
                title: 'New Ticket Assigned',
                message: `You have been assigned to ticket: ${data.title || data.ticketId}`,
                sender: userId,
                meta: { model: 'tickets', modelId: docId },
                receiversArray: [uid]
              });
            }
          }

          if (added.length > 0 || removed.length > 0) {
            // Emit updated event via socket
            await emitTicketEvent(docId, 'ticket_updated', {
              assignedTo: newAssignees
            });
          }
        }

        // 3. Task sync logic (pushTaskSync)
        if (body.pushTaskSync === true) {
          const ticketData = await models.tickets.findById(docId);
          if (ticketData && !ticketData.linkedTaskId) {
            const taskData = await models.tasks.create({
              clientId: ticketData.clientId,
              projectTypeId: ticketData.projectTypeId,
              taskTypeId: ticketData.taskTypeId,
              createdBy: ticketData.createdBy,
              assignedTo: ticketData.assignedTo || [],
              linkedTicketId: ticketData._id,
              isFromTicket: true,
              title: ticketData.title,
              userStory: ticketData.userStory,
              priorityLevel: ticketData.priority,
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
      } catch (error) {
        console.error('[tickets service] error in afterUpdate hook:', error);
      }
    },

    // ---------------- After Read ----------------
    afterRead: async ({ role, userId, docId, data }) => {
      try {
        if (!data) return data;
        const { default: models } = await import('../models/Collection.js');
        const { markCommentsAsRead, getUnreadCommentCount } = await import('./readReceiptsService.js');

        const isAgent = role.toString() === 'agent' || role.toString() === '6a25cbc1cd36294f5e578696';
        const userModel = isAgent ? 'agents' : 'employees';

        // 1. If fetching single ticket details (indicated by docId)
        if (docId) {
          const tickets = Array.isArray(data) ? data : [data];
          const ticket = tickets[0];
          if (ticket) {
            // Mark all comments for this ticket as read for the user
            await markCommentsAsRead(ticket._id.toString(), userId, userModel);

            // Strip internal comments for agents
            if (isAgent && ticket.comments) {
              ticket.comments = ticket.comments.filter(c => c.isPublic === true);
            }

            ticket.unreadCommentsCount = 0;
          }
          return Array.isArray(data) ? [ticket] : ticket;
        }

        // 2. If fetching a list of tickets (no docId)
        if (Array.isArray(data)) {
          const ticketsWithUnread = await Promise.all(data.map(async (ticket) => {
            const unreadCount = await getUnreadCommentCount(ticket._id, userId, userModel);
            
            // Also, strip internal comments for agents!
            if (isAgent && ticket.comments) {
              ticket.comments = ticket.comments.filter(c => c.isPublic === true);
            }
            
            return {
              ...ticket,
              unreadCommentsCount: unreadCount
            };
          }));
          return ticketsWithUnread;
        }

        return data;
      } catch (error) {
        console.error('[tickets service] afterRead error:', error);
        return data;
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