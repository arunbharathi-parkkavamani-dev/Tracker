/**
 * seedAssetCategories.js
 * Seeds 10 default asset categories.
 * Idempotent — upserts by code.
 *
 * Run: node src/scripts/seedAssetCategories.js
 *
 * Note: createdBy is set to the first Super Admin found.
 * If no admin exists, seed employees first.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracker';

// Default categories — code is the unique key for upsert
const DEFAULT_CATEGORIES = [
  { name: 'Laptop', code: 'LAP', warrantyMonths: 36, description: 'Portable computers and notebooks' },
  { name: 'Desktop', code: 'DKT', warrantyMonths: 36, description: 'Desktop computers and workstations' },
  { name: 'Mobile', code: 'MOB', warrantyMonths: 12, description: 'Smartphones and mobile devices' },
  { name: 'SIM Card', code: 'SIM', warrantyMonths: null, description: 'Corporate SIM cards and data plans' },
  { name: 'ID Card', code: 'IDC', warrantyMonths: null, description: 'Employee identity cards' },
  { name: 'Printer', code: 'PRT', warrantyMonths: 12, description: 'Printers, scanners, and MFPs' },
  { name: 'Monitor', code: 'MON', warrantyMonths: 24, description: 'External displays and monitors' },
  { name: 'Software License', code: 'SWL', warrantyMonths: 12, description: 'Software licenses and subscriptions' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  await import('../models/Collection.js');

  const AssetCategory = mongoose.model('assetcategories');
  const Employee = mongoose.model('employees');

  // Find any active employee to use as createdBy.
  // We just need a valid ObjectId — preferably an admin, but any active employee works.
  // Sorted by role level desc (via populate) — but since levels may not be set yet,
  // we simply take the first active employee.
  const anyEmployee = await Employee
    .findOne({ status: 'Active', isActive: true })
    .select('_id basicInfo.firstName basicInfo.lastName')
    .lean();

  if (!anyEmployee) {
    console.error('❌  No active employee found. Seed employees first.');
    process.exit(1);
  }

  const createdBy = anyEmployee._id;
  const name = `${anyEmployee.basicInfo?.firstName || ''} ${anyEmployee.basicInfo?.lastName || ''}`.trim();
  console.log(`   Using createdBy: ${createdBy} (${name || 'unknown'})\n`);

  let created = 0;
  let skipped = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await AssetCategory.findOne({ code: cat.code }).lean();

    if (existing) {
      console.log(`   ⏭️   ${cat.name} (${cat.code}) — already exists, skipped`);
      skipped++;
      continue;
    }

    await AssetCategory.create({
      ...cat,
      isActive: true,
      depreciationRate: null,
      createdBy
    });
    console.log(`   🆕  ${cat.name} (${cat.code})`);
    created++;
  }

  console.log(`\n📊  ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
  console.log('✅  Done.');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
