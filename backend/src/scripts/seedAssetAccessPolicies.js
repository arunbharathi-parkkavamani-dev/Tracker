/**
 * seedAssetAccessPolicies.js
 * Seeds AccessPolicies for Asset Management Phase 1 models:
 *   - assetcategories
 *   - assets
 *
 * Detection: role.level ranges only — zero hardcoded role names.
 *   Level 1–3  → Employee tier
 *   Level 4–6  → Manager tier
 *   Level 7–8  → Admin / IT tier
 *   Level 9–10 → Executive / MD tier
 *
 * Idempotent: findOneAndUpdate with upsert=true.
 * Run: node src/scripts/seedAssetAccessPolicies.js
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

// Models in scope for Phase 1
const ASSET_MODELS = ['assetcategories', 'assets'];

// ── Level fallback (by role name) ─────────────────────────────────────────────
//
// Used ONLY when role.level is 1 (default/unset).
// Run seedRoleLevels.js first to populate levels properly.
// After that this fallback is never hit.
//
const ROLE_LEVEL_FALLBACK = {
  // Employee tier
  'employee': 1, 'staff': 1, 'intern': 1, 'developer': 2, 'designer': 2,
  'analyst': 2, 'associate': 2, 'junior': 2, 'agent': 2,
  // Manager tier
  'team lead': 4, 'tl': 4, 'senior': 4, 'lead': 4, 'manager': 5,
  'project manager': 5, 'pm': 5, 'department head': 6, 'dept head': 6,
  // Admin tier
  'hr': 7, 'hr admin': 7, 'hradmin': 7, 'it admin': 7, 'it': 7,
  'operations': 7, 'finance': 7, 'admin': 8,
  // Executive tier
  'director': 9, 'vp': 9, 'vice president': 9, 'cto': 9, 'cfo': 9, 'ceo': 9,
  // MD / Owner
  'super admin': 10, 'superadmin': 10, 'md': 10, 'owner': 10, 'founder': 10,
};

/**
 * Resolve the effective level for a role.
 * Prefers role.level if already set (> 1).
 * Falls back to ROLE_LEVEL_FALLBACK by name.
 * Falls back to 1 (least privileged) if nothing matches.
 */
function resolveLevel(role) {
  if (role.level && role.level > 1) {
    return role.level;  // Already leveled by seedRoleLevels.js
  }
  const key = (role.name || '').toLowerCase().trim();
  const fallback = ROLE_LEVEL_FALLBACK[key];
  if (fallback !== undefined) {
    return fallback;
  }
  console.warn(`   ⚠️  Role "${role.name}" has no level set and no fallback mapping — defaulting to level 1.`);
  console.warn(`       Run seedRoleLevels.js to fix this permanently.`);
  return 1;
}


// ── Policy matrix by level tier ───────────────────────────────────────────────

function buildPolicy(roleId, modelName, level) {
  const base = {
    role: roleId,
    modelName,
    permissions: { read: false, create: false, update: false, delete: false },
    forbiddenAccess: { read: [], create: [], update: [], delete: [] },
    allowAccess: { read: [], create: [], update: [], delete: [] },
    registry: [],
    conditions: {}
  };

  // ── assetcategories ────────────────────────────────────────────────────────

  if (modelName === 'assetcategories') {
    if (level >= 1 && level <= 3) {
      // Employee: No access — category is internal admin data
      return base;
    }

    if (level >= 4 && level <= 6) {
      // Manager: Read only — needed for allocation dropdowns (Phase 2)
      base.permissions = { read: true, create: false, update: false, delete: false };
      base.allowAccess.read = ['*'];
      base.forbiddenAccess.delete = ['*'];
      return base;
    }

    if (level >= 7 && level <= 8) {
      // Admin / IT: Full management — no hard delete (soft via isActive)
      base.permissions = { read: true, create: true, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: ['name', 'code', 'description', 'depreciationRate', 'warrantyMonths', 'isActive', 'createdBy'],
        update: ['name', 'code', 'description', 'depreciationRate', 'warrantyMonths', 'isActive'],
        delete: []
      };
      base.forbiddenAccess.delete = ['*'];
      return base;
    }

    if (level >= 9) {
      // Executive / MD: Read only
      base.permissions = { read: true, create: false, update: false, delete: false };
      base.allowAccess.read = ['*'];
      base.forbiddenAccess.delete = ['*'];
      return base;
    }
  }

  // ── assets ────────────────────────────────────────────────────────────────

  if (modelName === 'assets') {
    if (level >= 1 && level <= 3) {
      // Employee: Read only.
      // Phase 1: Open read (all assets visible). Phase 2 will add 'isAllocatedTo'
      // registry to scope this down to only the employee's own allocated assets.
      base.permissions = { read: true, create: false, update: false, delete: false };
      base.allowAccess.read = ['*'];
      base.forbiddenAccess = {
        read: [],
        create: ['*'],
        update: ['*'],
        delete: ['*']
      };
      return base;
    }

    if (level >= 4 && level <= 6) {
      // Manager: Read + limited update (notes and storageLocation only)
      base.permissions = { read: true, create: false, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: [],
        update: ['notes', 'storageLocation'],
        delete: []
      };
      base.forbiddenAccess = {
        read: [],
        create: ['*'],
        update: ['assetId', 'createdBy', 'status', 'metaStatus', 'categoryId', 'serialNumber', 'imei', 'purchaseCost', 'invoiceFile', 'currentAllocatedTo', 'currentAllocationId'],
        delete: ['*']
      };
      return base;
    }

    if (level >= 7 && level <= 8) {
      // Admin / IT: Full management — no hard delete
      base.permissions = { read: true, create: true, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: [
          'categoryId', 'name', 'serialNumber', 'imei', 'make', 'model',
          'purchaseDate', 'purchaseCost', 'vendorName', 'invoiceNumber', 'invoiceFile',
          'warrantyExpiry', 'storageLocation', 'condition', 'conditionNotes', 'notes', 'createdBy'
          // assetId excluded — always auto-generated by beforeCreate hook
        ],
        update: [
          'categoryId', 'name', 'serialNumber', 'imei', 'make', 'model',
          'purchaseDate', 'purchaseCost', 'vendorName', 'invoiceNumber', 'invoiceFile',
          'warrantyExpiry', 'storageLocation', 'status', 'metaStatus',
          'condition', 'conditionNotes', 'notes'
          // assetId, createdBy excluded — stripped by beforeUpdate hook
        ],
        delete: []
      };
      base.forbiddenAccess.delete = ['*'];
      return base;
    }

    if (level >= 9) {
      // Executive / MD: Read only for reporting
      base.permissions = { read: true, create: false, update: false, delete: false };
      base.allowAccess.read = ['*'];
      base.forbiddenAccess = {
        read: [],
        create: ['*'],
        update: ['*'],
        delete: ['*']
      };
      return base;
    }
  }

  // Default: deny all
  return base;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Load models into mongoose registry
  await import('../models/Collection.js');

  const Role = mongoose.model('roles');
  const AccessPolicy = mongoose.model('accesspolicies');

  const roles = await Role.find({ isActive: true }).lean();
  console.log(`📋  Found ${roles.length} active roles\n`);

  let upsertedCount = 0;

  for (const role of roles) {
    const level = resolveLevel(role);  // Uses role.level if set; falls back to name-based map

    for (const modelName of ASSET_MODELS) {
      const policyDoc = buildPolicy(role._id, modelName, level);

      await AccessPolicy.findOneAndUpdate(
        { role: role._id, modelName },
        { $set: policyDoc },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }

    const levelSource = (role.level && role.level > 1) ? 'level field' : 'name fallback';
    console.log(`   ✅  ${role.name} → level ${level} (via ${levelSource}) → assetcategories + assets`);
  }

  console.log(`\n📊  Seeded ${upsertedCount} asset access policies across ${roles.length} roles.`);
  await mongoose.disconnect();
  console.log('✅  Done.');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
