/**
 * Seed script — assigns capabilities to existing roles.
 * Run once: node src/scripts/seedRoleCapabilities.js
 *
 * Capability convention: action:resource
 *   manage:salarystructures  — create/update salary structures
 *   manage:payroll           — run payroll, edit payroll records
 *   manage:employees         — create/update employees
 *   manage:leaves            — approve/reject leaves
 *   manage:attendance        — correct attendance records
 *   view:reports             — access HR reports & analytics
 */

import mongoose from 'mongoose';
import Role from '../models/Role.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

// Map: role name (lowercase) → capabilities
const ROLE_CAPABILITIES = {
  'super admin': ['manage:salarystructures', 'manage:payroll', 'manage:employees', 'manage:expenses', 'manage:agents', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'superadmin':  ['manage:salarystructures', 'manage:payroll', 'manage:employees', 'manage:expenses', 'manage:agents', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'admin':       ['manage:salarystructures', 'manage:payroll', 'manage:employees', 'manage:expenses', 'manage:agents', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'hr admin':    ['manage:salarystructures', 'manage:payroll', 'manage:employees', 'manage:expenses', 'manage:agents', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'hr':          ['manage:salarystructures', 'manage:payroll', 'manage:employees', 'manage:expenses', 'manage:agents', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'manager':     ['manage:expenses', 'manage:leaves', 'manage:attendance', 'view:reports'],
  'employee':    [],
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const roles = await Role.find({});
  let updated = 0;

  for (const role of roles) {
    const key = role.name.toLowerCase().trim();
    if (ROLE_CAPABILITIES[key] !== undefined) {
      role.capabilities = ROLE_CAPABILITIES[key];
      await role.save();
      console.log(`✅  ${role.name} → [${role.capabilities.join(', ') || 'none'}]`);
      updated++;
    } else {
      console.log(`⚠️   No mapping for role: "${role.name}" — skipped (add it to ROLE_CAPABILITIES)`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${roles.length} roles.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
