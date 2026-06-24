/**
 * Run once to seed default StatusConfig entries for asset allocations.
 * node src/scripts/seedAssetAllocationStatusConfigs.js
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

  await StatusConfig.findOneAndUpdate(
    { modelName: 'assetallocations' },
    {
      modelName: 'assetallocations',
      label: 'Asset Allocation Statuses',
      metaStatuses: [
        { key: 'active',   label: 'Active',   color: '#10B981', order: 0, isDefault: true },
        { key: 'inactive', label: 'Inactive', color: '#6B7280', order: 1 },
        { key: 'archive',  label: 'Archive',  color: '#8B5CF6', order: 2 },
      ],
      workflowStatuses: [
        { key: 'Pending Approval',  label: 'Pending Approval',  color: '#F59E0B', order: 0, isDefault: true, isTerminal: false },
        { key: 'Active',            label: 'Active',            color: '#10B981', order: 1, isDefault: false, isTerminal: false },
        { key: 'Returned',          label: 'Returned',          color: '#6B7280', order: 2, isDefault: false, isTerminal: true },
        { key: 'Transferred',       label: 'Transferred',       color: '#3B82F6', order: 3, isDefault: false, isTerminal: true },
        { key: 'Rejected',          label: 'Rejected',          color: '#EF4444', order: 4, isDefault: false, isTerminal: true },
      ],
    },
    { upsert: true, new: true }
  );
  console.log('✅ Asset Allocation statuses seeded');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('❌ Status seed failed:', err);
  process.exit(1);
});
