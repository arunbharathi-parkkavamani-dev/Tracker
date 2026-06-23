import models from '../models/Collection.js';
import { emitTicketEvent } from './ticketSocketEmitter.js';
import fcmService from './fcmService.js';
import mongoose from 'mongoose';

/**
 * Service hook class for 'ticket_comments' collection.
 */
export default function ticketCommentsService() {
  return {
    // ---------------- Before Create ----------------
    beforeCreate: async ({ role, userId, body }) => {
      // 1. Enforce creator fields
      body.commentedBy = new mongoose.Types.ObjectId(userId);
      
      const isAgent = role.toString() === 'agent' || role.toString() === '6a25cbc1cd36294f5e578696';
      body.commenterModel = isAgent ? 'agents' : 'employees';

      if (isAgent) {
        // External client agents can only make public comments
        body.isPublic = true;
      } else {
        // Default to public comment if not explicitly specified
        if (body.isPublic === undefined) {
          body.isPublic = true;
        }
      }

      // 2. Validate ticket exists and is accessible
      const ticket = await models.tickets.findById(body.ticketId).lean();
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Enforce client isolation for agents
      if (isAgent) {
        // Find agent and check client ID
        const agent = await models.agents.findById(userId).select('client').lean();
        if (!agent || !ticket.clientId || ticket.clientId.toString() !== agent.client.toString()) {
          throw new Error('⛔ Access Denied: You do not have permission to comment on this ticket.');
        }
      }

      return body;
    },

    // ---------------- After Create ----------------
    afterCreate: async ({ role, userId, modelName, docId }) => {
      try {
        // 1. Fetch created comment with populated creator details
        const comment = await models.ticket_comments.findById(docId).lean();
        if (!comment) return;

        // 2. Register the commenter as a watcher/participant on this ticket if not already added
        await models.ticket_participants.findOneAndUpdate(
          { ticketId: comment.ticketId, userId: comment.commentedBy },
          { 
            $setOnInsert: {
              userModel: comment.commenterModel,
              role: 'watcher'
            }
          },
          { upsert: true, new: true }
        );

        // 3. Mark the comment as read by the author themselves
        await models.ticket_comment_reads.findOneAndUpdate(
          { commentId: comment._id, userId: comment.commentedBy },
          {
            $setOnInsert: {
              userModel: comment.commenterModel,
              readAt: new Date()
            }
          },
          { upsert: true, new: true }
        );

        // 4. Determine status change and log status history if changed
        const ticket = await models.tickets.findById(comment.ticketId);
        if (ticket) {
          ticket.updatedAt = new Date();
          const oldStatus = ticket.status;
          let newStatus = oldStatus;

          if (comment.commenterModel === 'agents') {
            // Client Agent commented -> Ticket is waiting for Admin/Employee response
            newStatus = 'Waiting For Admin';
          } else if (comment.commenterModel === 'employees' && comment.isPublic) {
            // Employee made a public comment -> Ticket is waiting for Client response
            newStatus = 'Waiting For Client';
          }

          if (newStatus !== oldStatus) {
            ticket.status = newStatus;

            // Log status transition history
            await models.ticket_status_history.create({
              ticketId: ticket._id,
              fromStatus: oldStatus,
              toStatus: newStatus,
              changedBy: userId,
              changedByModel: comment.commenterModel
            });

            // Log status change activity
            await models.ticket_activity_logs.create({
              ticketId: ticket._id,
              action: 'status_changed',
              performedBy: userId,
              performedByModel: comment.commenterModel,
              details: { fromStatus: oldStatus, toStatus: newStatus }
            });

            // Emit status update socket event
            await emitTicketEvent(ticket._id, 'status_changed', {
              oldStatus,
              newStatus,
              changedBy: userId,
              changedByModel: comment.commenterModel
            });
          }
          await ticket.save();
        }

        // 5. Create activity log for the comment addition
        await models.ticket_activity_logs.create({
          ticketId: comment.ticketId,
          action: 'comment_added',
          performedBy: userId,
          performedByModel: comment.commenterModel,
          details: { commentId: comment._id, isPublic: comment.isPublic }
        });

        // 6. Fetch sender's name to include in socket and push payloads
        let commenterName = 'Someone';
        if (comment.commenterModel === 'employees') {
          const emp = await models.employees.findById(userId).select('basicInfo.firstName basicInfo.lastName').lean();
          if (emp) commenterName = `${emp.basicInfo?.firstName || ''} ${emp.basicInfo?.lastName || ''}`.trim();
        } else {
          const ag = await models.agents.findById(userId).select('name').lean();
          if (ag) commenterName = ag.name;
        }

        // 7. Emit comment addition via socket
        const socketPayload = {
          comment: {
            ...comment,
            commenterName
          }
        };
        await emitTicketEvent(comment.ticketId, 'comment_added', socketPayload);

        // 8. Dispatch Push / Email notifications to other participants
        const participants = await models.ticket_participants.find({ ticketId: comment.ticketId }).lean();
        let receiverIds = participants.map(p => p.userId.toString());

        // Do not notify the author
        receiverIds = receiverIds.filter(id => id !== userId.toString());

        if (receiverIds.length > 0) {
          // If comment is internal (isPublic = false), only notify internal employees
          if (!comment.isPublic) {
            const employeeParticipants = participants.filter(p => p.userModel === 'employees');
            receiverIds = employeeParticipants.map(p => p.userId.toString()).filter(id => id !== userId.toString());
          }

          if (receiverIds.length > 0) {
            const notificationTitle = `New comment on Ticket ${ticket?.ticketId || ''}`;
            const notificationMessage = `${commenterName}: ${comment.message}`;
            
            await fcmService.dispatchTicketNotification({
              type: 'ticket',
              title: notificationTitle,
              message: notificationMessage,
              sender: userId,
              meta: { model: 'tickets', modelId: comment.ticketId },
              receiversArray: receiverIds
            });
          }
        }
      } catch (error) {
        console.error('[ticket_comments service] error in afterCreate hook:', error);
      }
    },

    // ---------------- Before Update ----------------
    beforeUpdate: async ({ role, userId, docId, body, existingDoc }) => {
      if (!existingDoc) {
        existingDoc = await models.ticket_comments.findById(docId).lean();
      }
      if (!existingDoc) throw new Error('Comment not found');

      // Only the author can update their own comment
      if (existingDoc.commentedBy.toString() !== userId.toString()) {
        throw new Error('⛔ Access Denied: You can only edit your own comments.');
      }

      // Restrict modification to message / attachments only
      const updatedBody = {
        message: body.message || existingDoc.message,
        attachments: body.attachments || existingDoc.attachments,
        edited: true,
        editedAt: new Date()
      };

      return updatedBody;
    },

    // ---------------- After Update ----------------
    afterUpdate: async ({ role, userId, docId, data, body, beforeDoc }) => {
      try {
        const comment = await models.ticket_comments.findById(docId).lean();
        if (comment) {
          await models.tickets.findByIdAndUpdate(comment.ticketId, { updatedAt: new Date() });
        }
      } catch (error) {
        console.error('[ticket_comments service] error in afterUpdate hook:', error);
      }
    },

    // ---------------- Before Delete ----------------
    beforeDelete: async ({ role, userId, docId, modelName }) => {
      const comment = await models.ticket_comments.findById(docId).lean();
      if (!comment) throw new Error('Comment not found');

      // Check if user is the author
      const isAuthor = comment.commentedBy.toString() === userId.toString();
      if (isAuthor) return; // Author is allowed to delete

      // Check if user is Admin/Super Admin dynamically via Access Policies
      const policy = await models.accesspolicies.findOne({ role: role, modelName: 'ticket_comments' }).lean();
      const hasDeletePermission = policy?.permissions?.delete === true;

      if (!hasDeletePermission) {
        throw new Error('⛔ Access Denied: You do not have permission to delete this comment.');
      }
    },

    // ---------------- After Delete ----------------
    afterDelete: async ({ doc, userId }) => {
      try {
        if (doc && doc.ticketId) {
          await models.tickets.findByIdAndUpdate(doc.ticketId, { updatedAt: new Date() });
        }
      } catch (error) {
        console.error('[ticket_comments service] error in afterDelete hook:', error);
      }
    }
  };
}
