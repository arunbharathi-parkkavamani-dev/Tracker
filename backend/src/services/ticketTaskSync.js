class TicketTaskSyncService {
  // Sync task status back to ticket
  async syncTaskStatusToTicket(taskId, newStatus, updatedBy) {
    const { default: models } = await import('../models/Collection.js');
    
    try {
      const task = await models.tasks.findById(taskId);
      if (!task || !task.linkedTicketId) return;
      
      // Task enum:   Backlogs | To Do | In Progress | In Review | Approved | Rejected | Completed | Deleted
      // Ticket enum: Open | In Progress | Review | Testing | Completed | Closed
      const statusMapping = {
        'Backlogs':    'Open',
        'To Do':       'Open',
        'In Progress': 'In Progress',
        'In Review':   'Review',
        'Approved':    'Testing',
        'Rejected':    'Open',
        'Completed':   'Completed',
        'Deleted':     'Closed',
      };
      
      const ticketStatus = statusMapping[newStatus];
      if (!ticketStatus) return;
      
      await models.tickets.findByIdAndUpdate(task.linkedTicketId, {
        status: ticketStatus,
        ...(ticketStatus === 'Completed' && { resolvedAt: new Date() }),
        ...(ticketStatus === 'Closed'    && { closedAt:   new Date() }),
      });
      
    } catch (error) {
      console.error('Error syncing task status to ticket:', error);
    }
  }
  
  // Sync task assignment back to ticket
  async syncTaskAssignmentToTicket(taskId, assignedTo, updatedBy) {
    const { default: models } = await import('../models/Collection.js');
    
    try {
      const task = await models.tasks.findById(taskId);
      if (!task || !task.linkedTicketId) return;
      
      await models.tickets.findByIdAndUpdate(task.linkedTicketId, {
        assignedTo: assignedTo[0],
        $push: {
          comments: {
            comment: `Task assigned to developer`,
            commentedBy: updatedBy,
            commentedAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Error syncing task assignment to ticket:', error);
    }
  }
  
  // Check synchronization status
  async getSyncStatus(ticketId, taskId) {
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
        lastSync: Math.max(ticket?.updatedAt || 0, task?.updatedAt || 0)
      };
    } catch (error) {
      console.error('Error checking sync status:', error);
      return { isLinked: false, error: error.message };
    }
  }
}

export default new TicketTaskSyncService();