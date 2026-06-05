export default function expensesService() {
  return {
    async beforeCreate({ body, userId }) {
      // Always auto-stamp the employee from the authenticated user
      body.employeeId = userId;

      // Ensure expenses array exists
      const items = Array.isArray(body.expenses) ? body.expenses : [];

      // Compute derived fields server-side — never trust the client
      body.dayTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      body.totalExpenses = items.length;

      // Validate required fields
      if (!body.clientId) {
        throw new Error('clientId is required');
      }
      if (!body.date) {
        throw new Error('date is required');
      }
      if (items.length === 0) {
        throw new Error('At least one expense item is required');
      }
      if (body.dayTotal <= 0) {
        throw new Error('Total expense amount must be greater than zero');
      }

      // Default status
      body.status = 'pending';
      body.submittedAt = new Date();
    },

    async beforeUpdate({ body, userId, role }) {
      const { canDo } = await import('../utils/cache.js');
      const sensitiveFields = ['status', 'approvedBy', 'rejectedBy', 'approvedAt', 'rejectedAt'];
      const privileged = canDo(role, 'manage:expenses');

      for (const field of sensitiveFields) {
        if (body[field] !== undefined && !privileged) {
          throw new Error(`Only HR/Manager can update '${field}'`);
        }
      }

      if (body.status === 'approved' && privileged) {
        body.approvedBy = userId;
        body.approvedAt = new Date();
      }

      if (body.status === 'rejected' && privileged) {
        body.rejectedBy = userId;
        body.rejectedAt = new Date();
      }
    },

    /**
     * afterUpdate: Send FCM push to employee when their expense status changes.
     */
    async afterUpdate({ docId, data, beforeDoc }) {
      try {
        const statusChanged = data.status && data.status !== beforeDoc?.status;
        if (!statusChanged) return;

        const { default: models } = await import('../models/Collection.js');
        const { default: fcmService } = await import('./fcmService.js');

        const expense = await models.expenses.findById(docId).lean();
        if (!expense?.employeeId) return;

        const statusMessages = {
          approved: 'Your travel expense has been approved.',
          rejected: `Your travel expense has been rejected.${expense.rejectionReason ? ` Reason: ${expense.rejectionReason}` : ''}`
        };

        const message = statusMessages[data.status];
        if (!message) return;

        await fcmService.dispatchNotification({
          type: 'expense_status',
          title: `Expense ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
          message,
          sender: null,
          meta: { model: 'expenses', modelId: docId },
          receiversArray: [expense.employeeId]
        });
      } catch (error) {
        console.error('[expenses service] afterUpdate FCM error:', error);
      }
    }
  };
}
