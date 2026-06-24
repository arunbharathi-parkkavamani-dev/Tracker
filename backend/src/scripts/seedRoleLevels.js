/**
 * seedRoleLevels.js
 *
 * Assigns numeric `level` (1–10) to all existing roles.
 *
 * WHY THIS EXISTS:
 *   The Role model has always had a `level` field (1–10, default: 1),
 *   but it was never populated — all existing seeds used hardcoded role names.
 *   The Asset Management module and future modules use level-based policy logic
 *   instead of hardcoded names, which is safer and scales to custom roles.
 *
 * LEVEL SEMANTICS:
 *   1–3   Employee tier   — individual contributors, no admin capability
 *   4–6   Manager tier    — team leads, managers, approvers
 *   7–8   Admin tier      — HR, IT Admin, Operations Admin, full management
 *   9     Executive tier  — Director, VP, C-suite (read-heavy, finance visible)
 *   10    MD / Owner      — full access, financial exposure visible
 *
 * IDEMPOTENT: Only updates roles where level is currently 1 (the default/unset value).
 *             Safe to re-run — will skip already-leveled roles.
 *             To force re-level a role, remove it from the skipIfAlreadySet guard.
 *
 * Run: node src/scripts/seedRoleLevels.js
 */

import mongoose from 'mongoose';
import Role from '../models/Role.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

// ── Level map: role name (lowercase, trimmed) → level ─────────────────────────
//
// Add any custom roles your organisation uses.
// If a role name is not in this map, it will be printed as a warning and
// assigned level 1 (least privileged) by default.
//
const ROLE_LEVEL_MAP = {
  // Employee tier (1–3)
  'employee':           1,
  'staff':              1,
  'intern':             1,
  'developer':          2,
  'designer':           2,
  'analyst':            2,
  'associate':          2,
  'junior':             2,
  'agent':              2,   // Client-facing agent (external portal)

  // Manager tier (4–6)
  'team lead':          4,
  'tl':                 4,
  'senior':             4,
  'lead':               4,
  'manager':            5,
  'project manager':    5,
  'pm':                 5,
  'department head':    6,
  'dept head':          6,

  // Admin tier (7–8)
  'hr':                 7,
  'hr admin':           7,
  'hradmin':            7,
  'it admin':           7,
  'it':                 7,
  'operations':         7,
  'finance':            7,
  'admin':              8,

  // Executive tier (9)
  'director':           9,
  'vp':                 9,
  'vice president':     9,
  'cto':                9,
  'cfo':                9,
  'coo':                9,
  'ceo':                9,

  // MD / Owner (10)
  'super admin':        10,
  'superadmin':         10,
  'md':                 10,
  'owner':              10,
  'founder':            10,
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB\n');

  const roles = await Role.find({}).lean();
  console.log(`📋  Found ${roles.length} roles:\n`);

  let updated = 0;
  let alreadySet = 0;
  let unmapped = 0;

  for (const role of roles) {
    const key = role.name.toLowerCase().trim();
    const currentLevel = role.level || 1;
    const mappedLevel = ROLE_LEVEL_MAP[key];

    if (currentLevel > 1) {
      // Already has a non-default level — skip
      console.log(`   ⏭️   "${role.name}" — already level ${currentLevel}, skipped`);
      alreadySet++;
      continue;
    }

    if (mappedLevel === undefined) {
      // Role name not in map — assign level 1 (safe default) and warn
      await Role.updateOne({ _id: role._id }, { $set: { level: 1 } });
      console.log(`   ⚠️   "${role.name}" — not in ROLE_LEVEL_MAP, assigned level 1 (least privileged). Add it to the map if needed.`);
      unmapped++;
      continue;
    }

    await Role.updateOne({ _id: role._id }, { $set: { level: mappedLevel } });
    console.log(`   ✅  "${role.name}" → level ${mappedLevel}`);
    updated++;
  }

  console.log(`\n📊  Summary:`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   Skipped  : ${alreadySet} (already had level > 1)`);
  console.log(`   Unmapped : ${unmapped} (assigned level 1 — review these)`);
  console.log(`\n✅  Done. Run the backend server to reload the policy cache.`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
