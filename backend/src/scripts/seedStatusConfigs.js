/**
 * Run once to seed default StatusConfig entries for tasks and tickets.
 * node src/scripts/seedStatusConfigs.js
 */
import mongoose from 'mongoose';
import StatusConfig from '../models/StatusConfig.js';
import StatusMapping from '../models/StatusMapping.js';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

await mongoose.connect(process.env.MONGO_URI);

// ── Task statuses ─────────────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'tasks' },
  {
    modelName: 'tasks',
    label: 'Task Statuses',
    metaStatuses: [
      { key: 'active', label: 'Active', color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'draft', label: 'Draft', color: '#3B82F6', order: 2 },
      { key: 'archive', label: 'Archive', color: '#8B5CF6', order: 3 },
      { key: 'deleted', label: 'Deleted', color: '#EF4444', order: 4 },
    ],
    workflowStatuses: [
      { key: 'Backlogs', label: 'Backlogs', color: '#6B7280', order: 0, isDefault: true },
      { key: 'To Do', label: 'To Do', color: '#3B82F6', order: 1 },
      { key: 'In Progress', label: 'In Progress', color: '#F59E0B', order: 2 },
      { key: 'In Review', label: 'In Review', color: '#8B5CF6', order: 3 },
      { key: 'Approved', label: 'Approved', color: '#10B981', order: 4 },
      { key: 'Rejected', label: 'Rejected', color: '#EF4444', order: 5 },
      { key: 'Completed', label: 'Completed', color: '#059669', order: 6, isTerminal: true },
      { key: 'Deleted', label: 'Deleted', color: '#374151', order: 7, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Task statuses seeded');

// ── Ticket statuses ───────────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'tickets' },
  {
    modelName: 'tickets',
    label: 'Ticket Statuses',
    metaStatuses: [
      { key: 'active', label: 'Active', color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'draft', label: 'Draft', color: '#3B82F6', order: 2 },
      { key: 'archive', label: 'Archive', color: '#8B5CF6', order: 3 },
      { key: 'deleted', label: 'Deleted', color: '#EF4444', order: 4 },
    ],
    workflowStatuses: [
      { key: 'Open', label: 'Open', color: '#3B82F6', order: 0, isDefault: true },
      { key: 'In Progress', label: 'In Progress', color: '#F59E0B', order: 1 },
      { key: 'Review', label: 'Review', color: '#8B5CF6', order: 2 },
      { key: 'Testing', label: 'Testing', color: '#14B8A6', order: 3 },
      { key: 'Completed', label: 'Completed', color: '#10B981', order: 4, isTerminal: true },
      { key: 'Closed', label: 'Closed', color: '#6B7280', order: 5, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Ticket statuses seeded');

// ── Default tasks→tickets mapping ─────────────────────────────────────────────
await StatusMapping.findOneAndUpdate(
  { sourceModel: 'tasks', targetModel: 'tickets' },
  {
    sourceModel: 'tasks',
    targetModel: 'tickets',
    linkField: 'linkedTicketId',
    reverseLinkField: 'linkedTaskId',
    isActive: true,
    mappings: [
      { sourceStatus: 'Backlogs', targetStatus: 'Open' },
      { sourceStatus: 'To Do', targetStatus: 'Open' },
      { sourceStatus: 'In Progress', targetStatus: 'In Progress' },
      { sourceStatus: 'In Review', targetStatus: 'Review' },
      { sourceStatus: 'Approved', targetStatus: 'Testing' },
      { sourceStatus: 'Rejected', targetStatus: 'Open' },
      { sourceStatus: 'Completed', targetStatus: 'Completed' },
      { sourceStatus: 'Deleted', targetStatus: 'Closed' },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Task→Ticket status mapping seeded');

// ── Expense statuses ──────────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'expenses' },
  {
    modelName: 'expenses',
    label: 'Expense Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      { key: 'deleted',  label: 'Deleted',  color: '#EF4444', order: 3 },
    ],
    workflowStatuses: [
      { key: 'pending',  label: 'Pending',  color: '#F59E0B', order: 0, isDefault: true },
      { key: 'approved', label: 'Approved', color: '#10B981', order: 1, isTerminal: true },
      { key: 'rejected', label: 'Rejected', color: '#EF4444', order: 2, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Expense statuses seeded');

// ── Leave statuses ────────────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'leaves' },
  {
    modelName: 'leaves',
    label: 'Leave Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      { key: 'deleted',  label: 'Deleted',  color: '#EF4444', order: 3 },
    ],
    workflowStatuses: [
      { key: 'Pending',  label: 'Pending',  color: '#F59E0B', order: 0, isDefault: true },
      { key: 'Approved', label: 'Approved', color: '#10B981', order: 1, isTerminal: true },
      { key: 'Rejected', label: 'Rejected', color: '#EF4444', order: 2, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Leave statuses seeded');

// ── Regularization statuses ───────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'regularizations' },
  {
    modelName: 'regularizations',
    label: 'Regularization Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      { key: 'deleted',  label: 'Deleted',  color: '#EF4444', order: 3 },
    ],
    workflowStatuses: [
      { key: 'Pending',  label: 'Pending',  color: '#F59E0B', order: 0, isDefault: true },
      { key: 'Approved', label: 'Approved', color: '#10B981', order: 1, isTerminal: true },
      { key: 'Rejected', label: 'Rejected', color: '#EF4444', order: 2, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Regularization statuses seeded');

// ── DailyActivity statuses ────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'dailyactivities' },
  {
    modelName: 'dailyactivities',
    label: 'Daily Activity Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      { key: 'deleted',  label: 'Deleted',  color: '#EF4444', order: 3 },
    ],
    workflowStatuses: [
      { key: 'Pending',     label: 'Pending',     color: '#6B7280', order: 0, isDefault: true },
      { key: 'In Progress', label: 'In Progress', color: '#F59E0B', order: 1 },
      { key: 'Completed',   label: 'Completed',   color: '#10B981', order: 2, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ DailyActivity statuses seeded');

// ── HRPolicy statuses ─────────────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'hrpolicies' },
  {
    modelName: 'hrpolicies',
    label: 'HR Policy Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      { key: 'deleted',  label: 'Deleted',  color: '#EF4444', order: 3 },
    ],
    workflowStatuses: [
      { key: 'Draft',    label: 'Draft',    color: '#6B7280', order: 0, isDefault: true },
      { key: 'Active',   label: 'Active',   color: '#10B981', order: 1 },
      { key: 'Archived', label: 'Archived', color: '#8B5CF6', order: 2, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ HR Policy statuses seeded');

// ── Asset statuses ────────────────────────────────────────────────────────────
// condition (Excellent/Good/Fair/Poor/Damaged) is a plain enum field on Asset —
// it is NOT a StatusConfig entry because it is not a workflow status.
// Only the operational lifecycle status is registered here.
await StatusConfig.findOneAndUpdate(
  { modelName: 'assets' },
  {
    modelName: 'assets',
    label: 'Asset Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
    ],
    workflowStatuses: [
      { key: 'Available',    label: 'Available',    color: '#10B981', order: 0, isDefault: true, isTerminal: false },
      { key: 'Allocated',    label: 'Allocated',    color: '#3B82F6', order: 1, isDefault: false, isTerminal: false },
      { key: 'Reserved',     label: 'Reserved',     color: '#F59E0B', order: 2, isDefault: false, isTerminal: false },
      { key: 'Under Repair', label: 'Under Repair', color: '#8B5CF6', order: 3, isDefault: false, isTerminal: false },
      { key: 'Lost',         label: 'Lost',         color: '#EF4444', order: 4, isDefault: false, isTerminal: false },
      { key: 'Disposed',     label: 'Disposed',     color: '#6B7280', order: 5, isDefault: false, isTerminal: true  },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Asset statuses seeded');

// ── Asset purchase statuses ──────────────────────────────────────────────────
await StatusConfig.findOneAndUpdate(
  { modelName: 'assetpurchases' },
  {
    modelName: 'assetpurchases',
    label: 'Asset Purchase Statuses',
    metaStatuses: [
      { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
      { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
    ],
    workflowStatuses: [
      { key: 'Draft',             label: 'Draft',             color: '#6B7280', order: 0, isDefault: true },
      { key: 'Pending Approval',  label: 'Pending Approval',  color: '#F59E0B', order: 1 },
      { key: 'Approved',          label: 'Approved',          color: '#3B82F6', order: 2 },
      { key: 'Received',          label: 'Received',          color: '#10B981', order: 3, isTerminal: true },
      { key: 'Cancelled',         label: 'Cancelled',         color: '#EF4444', order: 4, isTerminal: true },
    ],
  },
  { upsert: true, new: true }
);
console.log('✅ Asset purchase statuses seeded');

await mongoose.disconnect();
console.log('Done.');
