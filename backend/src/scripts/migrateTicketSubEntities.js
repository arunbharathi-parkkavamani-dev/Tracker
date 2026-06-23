/**
 * migrateTicketSubEntities.js
 * Extracts legacy embedded comments and attachments from tickets and creates standalone documents.
 * Run once: node src/scripts/migrateTicketSubEntities.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tracker";

async function runMigration() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for migration');

  // Load models so schemas are registered
  await import('../models/Collection.js');

  const TicketComment = mongoose.model('ticket_comments');
  const TicketAttachment = mongoose.model('ticket_attachments');
  const TicketParticipant = mongoose.model('ticket_participants');

  // Get raw collection to bypass Mongoose schema virtuals/omissions
  const ticketsCollection = mongoose.connection.db.collection('tickets');
  const rawTickets = await ticketsCollection.find({}).toArray();

  console.log(`Found ${rawTickets.length} tickets to scan for migration...`);

  let commentsCount = 0;
  let attachmentsCount = 0;
  let participantsCount = 0;

  for (const ticket of rawTickets) {
    // 1. Migrate comments
    if (Array.isArray(ticket.comments) && ticket.comments.length > 0) {
      console.log(`Ticket ${ticket.ticketId || ticket._id}: Migrating ${ticket.comments.length} comments...`);
      for (const comment of ticket.comments) {
        // Resolve commentedBy and model
        let commenterId = comment.commentedBy || ticket.createdBy;
        let commenterModel = 'employees';
        
        // Try to identify agent commenter
        if (commenterId) {
          const agentExists = await mongoose.model('agents').findById(commenterId);
          if (agentExists) {
            commenterModel = 'agents';
          }
        }

        await TicketComment.create({
          ticketId: ticket._id,
          commentedBy: commenterId,
          commenterModel,
          message: comment.comment || comment.message || '',
          isPublic: comment.isPublic !== false,
          createdAt: comment.commentedAt || comment.createdAt || new Date(),
          updatedAt: comment.commentedAt || comment.updatedAt || new Date()
        });
        commentsCount++;
      }
    }

    // 2. Migrate attachments
    if (Array.isArray(ticket.attachments) && ticket.attachments.length > 0) {
      console.log(`Ticket ${ticket.ticketId || ticket._id}: Migrating ${ticket.attachments.length} attachments...`);
      for (const att of ticket.attachments) {
        let uploadedBy = ticket.createdBy;
        let uploadedByModel = ticket.createdByModel || 'employees';

        await TicketAttachment.create({
          ticketId: ticket._id,
          filename: att.filename,
          originalName: att.originalName || att.filename,
          path: att.path,
          mimetype: att.mimetype || 'application/octet-stream',
          size: att.size || 0,
          uploadedBy,
          uploadedByModel,
          createdAt: att.uploadedAt || att.createdAt || new Date(),
          updatedAt: att.uploadedAt || att.updatedAt || new Date()
        });
        attachmentsCount++;
      }
    }

    // 3. Create default participant records (creator & assignees)
    // Creator
    if (ticket.createdBy) {
      const exists = await TicketParticipant.findOne({ ticketId: ticket._id, userId: ticket.createdBy });
      if (!exists) {
        await TicketParticipant.create({
          ticketId: ticket._id,
          userId: ticket.createdBy,
          userModel: ticket.createdByModel || 'employees',
          role: 'creator'
        });
        participantsCount++;
      }
    }

    // Assignees
    if (Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0) {
      for (const empId of ticket.assignedTo) {
        if (!empId) continue;
        const exists = await TicketParticipant.findOne({ ticketId: ticket._id, userId: empId });
        if (!exists) {
          await TicketParticipant.create({
            ticketId: ticket._id,
            userId: empId,
            userModel: 'employees',
            role: 'assignee'
          });
          participantsCount++;
        }
      }
    }

    // 4. Unset legacy arrays from ticket document
    await ticketsCollection.updateOne(
      { _id: ticket._id },
      { $unset: { comments: "", attachments: "" } }
    );
  }

  console.log('\n--- Migration Results ---');
  console.log(`Migrated Ticket Comments:  ${commentsCount}`);
  console.log(`Migrated Ticket Attachments: ${attachmentsCount}`);
  console.log(`Created Ticket Participants: ${participantsCount}`);
  console.log('-------------------------\n');

  await mongoose.disconnect();
  console.log('Migration completed successfully.');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
