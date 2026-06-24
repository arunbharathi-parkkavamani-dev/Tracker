// services/assetrepairs.js
// Service hooks for the assetrepairs collection.
// Loaded automatically by servicesCache.js — filename must match collection key in Collection.js.

import models from '../models/Collection.js';

const ALLOWED_TRANSITIONS = {
  'Sent for Repair':  ['In Repair', 'Repaired', 'Beyond Repair'],
  'In Repair':        ['Repaired', 'Beyond Repair'],
  'Repaired':         [], // Terminal
  'Beyond Repair':    [], // Terminal
};

export default function () {
  return {
    /**
     * beforeCreate
     * ─────────────
     * 1. Validate asset exists.
     * 2. Force status = 'Sent for Repair' and metaStatus = 'active'.
     * 3. Set createdBy = userId.
     */
    beforeCreate: async ({ role, userId, body }) => {
      const data = body;

      if (userId) {
        data.createdBy = userId;
      }

      // Validate asset
      if (!data.assetId) {
        throw new Error('assetId is required.');
      }
      const asset = await models.assets.findById(data.assetId).lean();
      if (!asset) {
        throw new Error('Referenced asset not found.');
      }

      // Ensure defaults
      data.status = 'Sent for Repair';
      data.metaStatus = 'active';

      return data;
    },

    /**
     * afterCreate
     * ────────────
     * Ensure asset status is set to 'Under Repair'
     */
    afterCreate: async ({ docId }) => {
      const repair = await models.assetrepairs.findById(docId).lean();
      if (!repair) return;

      // Update asset status to 'Under Repair' if it isn't already
      await models.assets.findByIdAndUpdate(repair.assetId, {
        status: 'Under Repair'
      });
    },

    /**
     * beforeUpdate
     * ─────────────
     * Enforce status transitions
     */
    beforeUpdate: async ({ body, docId }) => {
      const data = body;
      if (!docId) return data;

      const current = await models.assetrepairs.findById(docId).select('status').lean();
      if (!current) {
        throw new Error('Asset repair record not found.');
      }

      if (data.status !== undefined) {
        const allowed = ALLOWED_TRANSITIONS[current.status] || [];
        if (current.status === data.status) {
          delete data.status;
        } else if (!allowed.includes(data.status)) {
          throw new Error(`Invalid status transition: "${current.status}" → "${data.status}" is not allowed.`);
        }
      }

      return data;
    },

    /**
     * afterUpdate
     * ────────────
     * Update asset register status & condition when repair is finalized
     */
    afterUpdate: async ({ docId, data, beforeDoc, userId }) => {
      const statusChanged = data.status && data.status !== beforeDoc.status;
      if (!statusChanged) return;

      const repair = await models.assetrepairs.findById(docId).lean();
      if (!repair) return;

      if (repair.status === 'Repaired') {
        const assetUpdate = {
          status: 'Available',
          condition: repair.repairCondition || 'Good',
          conditionLastAssessedAt: new Date(),
          currentAllocatedTo: null,
          currentAllocationId: null
        };
        if (userId) {
          assetUpdate.conditionLastAssessedBy = userId;
        }
        await models.assets.findByIdAndUpdate(repair.assetId, assetUpdate);
      } else if (repair.status === 'Beyond Repair') {
        await models.assets.findByIdAndUpdate(repair.assetId, {
          status: 'Disposed',
          condition: 'Damaged',
          conditionLastAssessedAt: new Date(),
          currentAllocatedTo: null,
          currentAllocationId: null
        });
      }
    }
  };
}
