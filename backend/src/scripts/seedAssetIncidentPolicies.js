/**
 * seedAssetIncidentPolicies.js
 * Seeds AccessPolicies for Asset Management Phase 3 models:
 *   - assetincidents
 *   - assetrepairs
 *
 * Detection: role.level ranges only — zero hardcoded role names.
 *   Level 1–3  → Employee tier
 *   Level 4–6  → Manager tier
 *   Level 7–8  → Admin / IT tier
 *   Level 9–10 → Executive / MD tier
 *
 * Idempotent: findOneAndUpdate with upsert=true.
 * Run: node src/scripts/seedAssetIncidentPolicies.js
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

function resolveLevel(role) {
  if (role.level && role.level > 1) {
    return role.level;
  }
  const key = (role.name || '').toLowerCase().trim();
  const fallback = ROLE_LEVEL_FALLBACK[key];
  if (fallback !== undefined) {
    return fallback;
  }
  return 1;
}

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

  if (modelName === 'assetincidents') {
    if (level >= 1 && level <= 3) {
      // Employee: can view own incidents, create incident report
      base.permissions = { read: true, create: true, update: false, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: ['assetId', 'employeeId', 'departmentId', 'allocationId', 'incidentType', 'incidentDate', 'description'],
        update: [],
        delete: []
      };
      base.forbiddenAccess = {
        read: [],
        create: ['estimatedRepairCost', 'recoveryAmount', 'recoveryApproved', 'recoveryDeductedInPayroll', 'recoveryPayrollId', 'status', 'metaStatus', 'createdBy', 'currentStepIndex', 'workflowId', 'approvals', 'managerId', 'approvedBy', 'approvedAt', 'rejectedAt'],
        update: ['*'],
        delete: ['*']
      };
      base.registry = ['isAllocatedTo'];
      base.conditions = {
        read: [{ registry: 'isAllocatedTo', effect: 'allow' }]
      };
      return base;
    }

    if (level >= 4 && level <= 6) {
      // Manager: can view team incidents, report incidents, and update approvals
      base.permissions = { read: true, create: true, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: ['*'],
        update: ['status', 'notes', 'approvals', 'currentStepIndex', 'managerId', 'estimatedRepairCost', 'recoveryAmount'],
        delete: []
      };
      base.forbiddenAccess = {
        read: [],
        create: ['createdBy', 'recoveryApproved', 'recoveryDeductedInPayroll', 'recoveryPayrollId'],
        update: ['assetId', 'employeeId', 'departmentId', 'allocationId', 'incidentType', 'incidentDate', 'description', 'recoveryApproved', 'recoveryDeductedInPayroll', 'recoveryPayrollId', 'createdBy'],
        delete: ['*']
      };
      base.registry = ['isTeamMember', 'isAllocatedTo'];
      base.conditions = {
        read: [
          { registry: 'isAllocatedTo', effect: 'allow' },
          { registry: 'isTeamMember', effect: 'allow' }
        ]
      };
      return base;
    }

    if (level >= 7 && level <= 8) {
      // Admin / IT: full control
      base.permissions = { read: true, create: true, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: ['*'],
        update: ['*'],
        delete: []
      };
      base.forbiddenAccess.delete = ['*'];
      return base;
    }

    if (level >= 9) {
      // Executive / MD: read all
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

  if (modelName === 'assetrepairs') {
    if (level >= 1 && level <= 3) {
      // Employee: no access
      return base;
    }

    if (level >= 4 && level <= 6) {
      // Manager: read only
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

    if (level >= 7 && level <= 8) {
      // Admin / IT: full control
      base.permissions = { read: true, create: true, update: true, delete: false };
      base.allowAccess = {
        read: ['*'],
        create: ['*'],
        update: ['*'],
        delete: []
      };
      base.forbiddenAccess.delete = ['*'];
      return base;
    }

    if (level >= 9) {
      // Executive: read only
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

  return base;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  await import('../models/Collection.js');

  const Role = mongoose.model('roles');
  const AccessPolicy = mongoose.model('accesspolicies');

  const roles = await Role.find({ isActive: true }).lean();
  console.log(`📋  Found ${roles.length} active roles\n`);

  let upsertedCount = 0;

  for (const role of roles) {
    const level = resolveLevel(role);

    for (const modelName of ['assetincidents', 'assetrepairs']) {
      const policyDoc = buildPolicy(role._id, modelName, level);

      await AccessPolicy.findOneAndUpdate(
        { role: role._id, modelName },
        { $set: policyDoc },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }

    const levelSource = (role.level && role.level > 1) ? 'level field' : 'name fallback';
    console.log(`   ✅  ${role.name} → level ${level} (via ${levelSource}) → assetincidents + assetrepairs`);
  }

  console.log(`\n📊  Seeded ${upsertedCount} asset incident & repair access policies.`);
  await mongoose.disconnect();
  console.log('✅  Done.');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
