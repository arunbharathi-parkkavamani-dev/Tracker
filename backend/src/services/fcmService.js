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

    // Map custom/legacy types to valid Schema enums:
    const TYPE_MAPPING = {
      'attendance_request': 'system',
      'regularization_request': 'system',
      'leaves_request': 'leave',
      'leaves_status': 'leave',
      'regularizations_request': 'system',
      'regularizations_status': 'system',
      'task_comment': 'comment',
      'task_mention': 'mention',
      'leave_request': 'leave',
      'leave_response': 'leave',
    };

    let resolvedType = TYPE_MAPPING[type] || type;
    const ALLOWED_TYPES = ['post', 'mention', 'reaction', 'comment', 'ticket', 'task', 'leave', 'system'];
    if (!ALLOWED_TYPES.includes(resolvedType)) {
      resolvedType = 'system';
    }

    // 1. Create Content
    const contentDoc = await models.notifications.create({
      type: resolvedType,
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

  /**
   * Sends a unified FCM Push + Offline Email notification for ticket events
   */
  async dispatchTicketNotification({ type, title, message, sender, meta, receiversArray }) {
    // 1. Dispatch normal push notification via Firebase/receptionist
    await this.dispatchNotification({ type, title, message, sender, meta, receiversArray });

    // 2. Identify who is offline and send email
    try {
      if (!receiversArray || receiversArray.length === 0) return;
      
      let receiverIds = [...new Set(receiversArray.map(id => id.toString()))];
      if (sender) {
        receiverIds = receiverIds.filter(id => id !== sender.toString());
      }
      
      if (receiverIds.length === 0) return;

      const { default: models } = await import('../models/Collection.js');
      const { default: nodemailer } = await import('nodemailer');

      // Fetch active sessions for these receivers
      const activeSessions = await models.session.find({
        userId: { $in: receiverIds },
        status: 'Active'
      }).select('userId').lean();
      
      const activeUserIds = new Set(activeSessions.map(s => s.userId.toString()));
      const offlineUserIds = receiverIds.filter(id => !activeUserIds.has(id));

      if (offlineUserIds.length === 0) {
        console.log('[DEBUG-FCM] No offline users to email.');
        return;
      }

      // Fetch emails for employees and agents who are offline
      const [offlineEmployees, offlineAgents] = await Promise.all([
        models.employees.find({ _id: { $in: offlineUserIds } }).select('basicInfo.firstName basicInfo.lastName authInfo.workEmail').lean(),
        models.agents.find({ _id: { $in: offlineUserIds } }).select('name email').lean()
      ]);

      const emailRecipients = [];
      offlineEmployees.forEach(emp => {
        if (emp.authInfo?.workEmail) {
          emailRecipients.push({
            name: `${emp.basicInfo?.firstName || ''} ${emp.basicInfo?.lastName || ''}`.trim(),
            email: emp.authInfo.workEmail
          });
        }
      });
      offlineAgents.forEach(agent => {
        if (agent.email) {
          emailRecipients.push({
            name: agent.name,
            email: agent.email
          });
        }
      });

      if (emailRecipients.length === 0) return;

      const emailConfig = await models.emailconfigs.findOne();
      if (!emailConfig || !emailConfig.enabled) {
        console.warn('[FCMService] Offline email notification skipped: SMTP not configured or disabled');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Send email to each offline user
      const emailPromises = emailRecipients.map(async (recipient) => {
        const mailOptions = {
          from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
          to: recipient.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333333;">${title}</h2>
              <p>Hello ${recipient.name},</p>
              <p>You have a new update regarding a ticket:</p>
              <blockquote style="background-color: #f9f9f9; border-left: 4px solid #007bff; padding: 10px 15px; margin: 20px 0;">
                ${message}
              </blockquote>
              <p>Please log in to the portal to view the details.</p>
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 12px; color: #777777;">This is an automated notification from the Tracker System. Please do not reply directly to this email.</p>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`[FCMService] Offline email sent to ${recipient.email}`);
        } catch (err) {
          console.error(`[FCMService] Failed to send offline email to ${recipient.email}:`, err.message);
        }
      });

      await Promise.allSettled(emailPromises);

    } catch (error) {
      console.error('[FCMService] dispatchTicketNotification email loop error:', error);
    }
  }
}

export default new FCMService();
