/**
 * seedTicketAccessPolicies.js
 * Seeds dynamic AccessPolicies for tickets and new sub-entities in the database.
 * Run once: node src/scripts/seedTicketAccessPolicies.js
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

const TICKET_MODELS = [
  'tickets',
  'ticket_comments',
  'ticket_comment_reads',
  'ticket_participants',
  'ticket_activity_logs',
  'ticket_status_history',
  'ticket_assignments',
  'ticket_attachments'
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Load models so schemas are registered
  await import('../models/Collection.js');

  const Role = mongoose.model('roles');
  const AccessPolicy = mongoose.model('accesspolicies');

  const roles = await Role.find({}).lean();
  console.log(`Found ${roles.length} roles:`, roles.map(r => r.name));

  let upsertedCount = 0;

  for (const role of roles) {
    const roleName = role.name.toLowerCase().trim();
    const isClientAgent = roleName === 'agent';
    const isAdminOrHR = ['super admin', 'superadmin', 'admin', 'hr admin', 'hr', 'hradmin'].includes(roleName);
    const isEmployee = ['employee', 'developer', 'staff', 'manager', 'team lead', 'tl'].includes(roleName);

    console.log(`Processing policies for role: "${role.name}" (Type: ${isAdminOrHR ? 'Admin/HR' : isEmployee ? 'Employee' : isClientAgent ? 'Agent' : 'Unknown'})`);

    for (const modelName of TICKET_MODELS) {
      let policyDoc = {
        role: role._id,
        modelName,
        permissions: { read: false, create: false, update: false, delete: false },
        forbiddenAccess: { read: [], create: [], update: [], delete: [] },
        allowAccess: { read: [], create: [], update: [], delete: [] },
        registry: [],
        conditions: {}
      };

      if (isAdminOrHR) {
        // Full CRUD access on all ticketing entities
        policyDoc.permissions = { read: true, create: true, update: true, delete: true };
        policyDoc.allowAccess = { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] };
      } else if (isEmployee) {
        // Read, Create, and Update on ticketing entities, but no Delete
        policyDoc.permissions = { read: true, create: true, update: true, delete: false };
        policyDoc.allowAccess = { read: ['*'], create: ['*'], update: ['*'], delete: [] };
        policyDoc.forbiddenAccess = { delete: ['*'] };
        
        // Employees can comment on all tickets (no restrictions since they are internal employees)
        if (modelName === 'ticket_comments') {
          policyDoc.allowAccess.read = ['*']; // Employees can view all comments (public + internal)
        }
      } else if (isClientAgent) {
        // Client Agent: Restricted access based on Same Client organization relationship
        policyDoc.permissions = { read: true, create: true, update: true, delete: false };
        policyDoc.forbiddenAccess = { delete: ['*'] };
        policyDoc.registry = ['isSameClient'];

        if (modelName === 'tickets') {
          policyDoc.allowAccess = {
            read: ['*'],
            create: ['title', 'description', 'userStory', 'product', 'priority', 'type', 'dueDate', 'attachments'],
            update: ['title', 'description', 'userStory', 'priority', 'status', 'attachments'],
            delete: []
          };
          policyDoc.conditions = {
            read: [{ registry: 'isSameClient', effect: 'allow' }],
            update: [{ registry: 'isSameClient', effect: 'allow' }],
            create: [{ registry: 'isSameClient', effect: 'allow' }]
          };
        } else if (modelName === 'ticket_comments') {
          // Agents can read/write comments belonging to their client tickets
          policyDoc.allowAccess = {
            read: ['*'], // Fields inside comment (message, commenter etc.)
            create: ['ticketId', 'message', 'attachments'],
            update: [],
            delete: []
          };
          policyDoc.conditions = {
            read: [{ registry: 'isSameClient', effect: 'allow' }],
            create: [{ registry: 'isSameClient', effect: 'allow' }]
          };
        } else if (modelName === 'ticket_attachments') {
          policyDoc.allowAccess = {
            read: ['*'],
            create: ['*'],
            update: [],
            delete: []
          };
          policyDoc.conditions = {
            read: [{ registry: 'isSameClient', effect: 'allow' }],
            create: [{ registry: 'isSameClient', effect: 'allow' }]
          };
        } else {
          // Other ticketing collections (status history, logs, reads)
          policyDoc.allowAccess = {
            read: ['*'],
            create: ['*'],
            update: [],
            delete: []
          };
          policyDoc.conditions = {
            read: [{ registry: 'isSameClient', effect: 'allow' }]
          };
        }
      }

      await AccessPolicy.findOneAndUpdate(
        { role: role._id, modelName },
        { $set: policyDoc },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }
  }

  console.log(`\nSuccessfully seeded ${upsertedCount} ticket access policies.`);
  await mongoose.disconnect();
  console.log('DB Connection closed.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
