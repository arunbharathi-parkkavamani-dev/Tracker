/**
 * Run once to seed default StatusConfig entries for asset incidents and repairs.
 * node src/scripts/seedAssetIncidentStatusConfigs.js
 */
import mongoose from 'mongoose';
import StatusConfig from '../models/StatusConfig.js';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracker';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Seed assetincidents StatusConfig
  await StatusConfig.findOneAndUpdate(
    { modelName: 'assetincidents' },
    {
      modelName: 'assetincidents',
      label: 'Asset Incident Statuses',
      metaStatuses: [
        { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
        { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
        { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      ],
      workflowStatuses: [
        { key: 'Reported',            label: 'Reported',            color: '#F59E0B', order: 0, isDefault: true, isTerminal: false },
        { key: 'Under Investigation', label: 'Under Investigation', color: '#3B82F6', order: 1, isDefault: false, isTerminal: false },
        { key: 'Approved',            label: 'Approved (Recovery)', color: '#10B981', order: 2, isDefault: false, isTerminal: false },
        { key: 'Rejected',            label: 'Rejected',            color: '#EF4444', order: 3, isDefault: false, isTerminal: true },
        { key: 'Closed',              label: 'Closed',              color: '#6B7280', order: 4, isDefault: false, isTerminal: true },
      ],
    },
    { upsert: true, new: true }
  );
  console.log('✅ Asset Incident statuses seeded');

  // Seed assetrepairs StatusConfig
  await StatusConfig.findOneAndUpdate(
    { modelName: 'assetrepairs' },
    {
      modelName: 'assetrepairs',
      label: 'Asset Repair Statuses',
      metaStatuses: [
        { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
        { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
      ],
      workflowStatuses: [
        { key: 'Sent for Repair', label: 'Sent for Repair', color: '#F59E0B', order: 0, isDefault: true, isTerminal: false },
        { key: 'In Repair',       label: 'In Repair',       color: '#3B82F6', order: 1, isDefault: false, isTerminal: false },
        { key: 'Repaired',        label: 'Repaired',        color: '#10B981', order: 2, isDefault: false, isTerminal: true },
        { key: 'Beyond Repair',   label: 'Beyond Repair',   color: '#EF4444', order: 3, isDefault: false, isTerminal: true },
      ],
    },
    { upsert: true, new: true }
  );
  console.log('✅ Asset Repair statuses seeded');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('❌ Status seed failed:', err);
  process.exit(1);
});
