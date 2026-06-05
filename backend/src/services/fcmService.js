import admin from 'firebase-admin';
import models from '../models/Collection.js';
import JobQueue from './jobQueue.js';

// Initialize Firebase Admin without explicit credentials. 
// It expects the GOOGLE_APPLICATION_CREDENTIALS environment variable to be set.
try {
  admin.initializeApp();
} catch (error) {
  console.warn('Firebase Admin initialization failed. Make sure GOOGLE_APPLICATION_CREDENTIALS is set in the environment.', error.message);
}

const fcmQueue = new JobQueue({
  concurrency: 5,
  batchSize: 100,
  retryAttempts: 3,
  retryDelay: 5000
});

class FCMService {
  /**
   * Pushes a notification via FCM and tracks delivery in NotificationReceptionist
   * @param {Object} contentDoc - The Notification document
   * @param {Array<Object>} receptionistDocs - Array of NotificationReceptionist documents
   * @param {Array<String>} tokens - Array of FCM device tokens
   */
  async sendMulticast(contentDoc, receptionistDocs, tokens) {
    if (!tokens || tokens.length === 0) {
      // Mark all as failed if no tokens are available
      await models.NotificationReceptionist.updateMany(
        { _id: { $in: receptionistDocs.map(r => r._id) } },
        { $set: { fcmStatus: 'failed', fcmErrorReason: 'No FCM token registered' } }
      );
      return;
    }

    const payload = {
      notification: {
        title: contentDoc.title,
        body: contentDoc.message
      },
      data: {
        type: contentDoc.type,
        model: contentDoc.meta?.model || '',
        modelId: contentDoc.meta?.modelId?.toString() || '',
        notificationId: contentDoc._id.toString()
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      
      // Update the receptionist records based on FCM response
      // For simplicity, we assume one token per user in this batch or that if any fail, we track it
      // In a production scenario, you would map tokens back to specific users
      
      const successIds = [];
      const failedIds = [];
      
      // If we just pushed to everyone, we can simply mark the whole batch sent for now,
      // or implement detailed tracking if tokens are mapped perfectly to receptionists.
      if (response.failureCount === 0) {
        await models.NotificationReceptionist.updateMany(
          { _id: { $in: receptionistDocs.map(r => r._id) } },
          { $set: { fcmStatus: 'sent' } }
        );
      } else {
        // Detailed tracking
        response.responses.forEach((resp, idx) => {
          if (resp.success) {
            successIds.push(receptionistDocs[idx]?._id);
          } else {
            failedIds.push({
              id: receptionistDocs[idx]?._id,
              error: resp.error?.message || 'Unknown error'
            });
          }
        });

        if (successIds.length > 0) {
          await models.NotificationReceptionist.updateMany(
            { _id: { $in: successIds.filter(Boolean) } },
            { $set: { fcmStatus: 'sent' } }
          );
        }

        // Handle failures individually to record specific reasons
        for (const failure of failedIds) {
          if (failure.id) {
            await models.NotificationReceptionist.updateOne(
              { _id: failure.id },
              { $set: { fcmStatus: 'failed', fcmErrorReason: failure.error } }
            );
          }
        }
      }
    } catch (error) {
      console.error('FCM Multicast Error:', error);
      await models.NotificationReceptionist.updateMany(
        { _id: { $in: receptionistDocs.map(r => r._id) } },
        { $set: { fcmStatus: 'failed', fcmErrorReason: error.message } }
      );
      throw error; // Rethrow to let the queue handle retries
    }
  }

  /**
   * Helper to create and dispatch a notification completely
   */
  async dispatchNotification({ type, title, message, sender, meta, receiversArray }) {
    console.log('[DEBUG-FCM] dispatchNotification initiated:', { type, sender, rawReceivers: receiversArray });
    if (!receiversArray || receiversArray.length === 0) {
      console.log('[DEBUG-FCM] No receivers provided.');
      return;
    }

    // Deduplicate receivers and remove sender
    let receiverIds = [...new Set(receiversArray.map(id => id.toString()))];
    if (sender) {
      receiverIds = receiverIds.filter(id => id !== sender.toString());
    }

    if (receiverIds.length === 0) {
      console.log('[DEBUG-FCM] All receivers filtered out (sender self-notification blocked).');
      return;
    }
    console.log('[DEBUG-FCM] Final filtered receivers:', receiverIds);

    // 1. Create Content
    const contentDoc = await models.notifications.create({
      type,
      title,
      message,
      sender: sender || undefined,
      meta
    });

    // 2. Fetch Sessions to get active FCM tokens
    const sessions = await models.session.find({ 
      userId: { $in: receiverIds },
      status: 'Active',
      fcmToken: { $ne: null }
    }).select('userId fcmToken').lean();
    
    // 3. Create Receptionists (one per distinct receiver)
    const receptionistPayloads = receiverIds.map(uid => ({
      notificationId: contentDoc._id,
      receiver: uid,
      fcmStatus: 'pending'
    }));

    try {
      const receptionistDocs = await models.NotificationReceptionist.insertMany(receptionistPayloads);
      console.log('[DEBUG-FCM] Created receptionist docs count:', receptionistDocs.length);
      
      // 4. Collect all tokens
      const tokens = sessions.map(s => s.fcmToken).filter(Boolean);
      console.log('[DEBUG-FCM] Tokens available for push:', tokens.length);

      // 5. Send FCM by adding to queue
      fcmQueue.add({
        handler: async (data) => {
          await this.sendMulticast(data.contentDoc, data.receptionistDocs, data.tokens);
        },
        data: {
          contentDoc,
          receptionistDocs,
          tokens
        }
      });
      console.log('[DEBUG-FCM] Added FCM dispatch task to queue');
    } catch (err) {
      console.error('[DEBUG-FCM] Failed to insertMany receptionists:', err);
    }
  }
}

export default new FCMService();
