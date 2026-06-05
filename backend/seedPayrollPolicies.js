/**
 * seedPayrollPolicies.js
 * Run once: node seedPayrollPolicies.js
 * Seeds AccessPolicies for payrolls, salarystructures, payrollruns, holidays.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

const MONGODB_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Role           = mongoose.model('roles',         (await import('./src/models/Role.js')).default.schema);
  const AccessPolicy   = mongoose.model('accesspolicies',(await import('./src/models/AccessPolicies.js')).default.schema);

  // Dynamically re-import already-registered models
  const roles = await mongoose.model('roles').find({}).lean();

  const byName = {};
  for (const r of roles) byName[r.name.toLowerCase()] = r._id;

  console.log('Roles found:', Object.keys(byName));

  const superadminId = byName['superadmin'] || byName['super admin'];
  const hrId         = byName['hr']         || byName['hr admin'];
  const managerId    = byName['manager'];
  const employeeId   = byName['employee'];

  if (!superadminId) { console.error('superadmin role not found'); process.exit(1); }

  const policies = [];

  // ── payrolls ───────────────────────────────────────────────────────────────

  // superadmin — full (no delete)
  for (const roleId of [superadminId, hrId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'payrolls',
      permissions: { read: true, create: true, update: true, delete: false },
      forbiddenAccess: {
        read: [], create: [], delete: ['*'],
        update: ['grossSalary', 'netSalary', 'earnedBreakdown', 'deductionBreakdown', 'frozenAt',
                 'processedBy', 'processedAt', 'workingDays', 'presentDays', 'lopDays', 'overtimePay']
      },
      allowAccess: { read: ['*'], create: ['*'], update: ['status', 'remarks', 'approvedBy', 'approvedAt', 'frozenAt', 'paidAt'], delete: [] },
      registry: [], conditions: {}
    });
  }

  // manager — zero access
  if (managerId) {
    policies.push({
      role: managerId, modelName: 'payrolls',
      permissions: { read: false, create: false, update: false, delete: false },
      forbiddenAccess: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] },
      allowAccess: { read: [], create: [], update: [], delete: [] },
      registry: [], conditions: {}
    });
  }

  // employee — self read only
  if (employeeId) {
    policies.push({
      role: employeeId, modelName: 'payrolls',
      permissions: { read: true, create: false, update: false, delete: false },
      forbiddenAccess: { read: [], create: ['*'], update: ['*'], delete: ['*'] },
      allowAccess: { read: ['*'], create: [], update: [], delete: [] },
      registry: ['isSelf'],
      conditions: { read: [{ registry: 'isSelf', effect: 'allow' }] }
    });
  }

  // ── salarystructures ──────────────────────────────────────────────────────

  for (const roleId of [superadminId, hrId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'salarystructures',
      permissions: { read: true, create: true, update: true, delete: false },
      forbiddenAccess: { read: [], create: [], update: ['employeeId', 'version', 'effectiveFrom'], delete: ['*'] },
      allowAccess: { read: ['*'], create: ['*'], update: ['effectiveTo', 'overtimeRate', 'esiApplicable', 'pfCeiling', 'pfEmployeePercent'], delete: [] },
      registry: [], conditions: {}
    });
  }

  for (const roleId of [managerId, employeeId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'salarystructures',
      permissions: { read: false, create: false, update: false, delete: false },
      forbiddenAccess: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] },
      allowAccess: { read: [], create: [], update: [], delete: [] },
      registry: [], conditions: {}
    });
  }

  // ── payrollruns ───────────────────────────────────────────────────────────

  for (const roleId of [superadminId, hrId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'payrollruns',
      permissions: { read: true, create: true, update: true, delete: false },
      forbiddenAccess: {
        read: [], create: [], delete: ['*'],
        update: ['month', 'year', 'employeeIds', 'totalEmployees', 'initiatedBy',
                 'processedCount', 'failedCount', 'totalGross', 'totalNet']
      },
      allowAccess: { read: ['*'], create: ['*'], update: ['status', 'notes', 'approvedBy', 'approvedAt', 'paidAt', 'payrollAuditEvents'], delete: [] },
      registry: [], conditions: {}
    });
  }

  for (const roleId of [managerId, employeeId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'payrollruns',
      permissions: { read: false, create: false, update: false, delete: false },
      forbiddenAccess: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] },
      allowAccess: { read: [], create: [], update: [], delete: [] },
      registry: [], conditions: {}
    });
  }

  // ── holidays ──────────────────────────────────────────────────────────────

  for (const roleId of [superadminId, hrId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'holidays',
      permissions: { read: true, create: true, update: true, delete: true },
      forbiddenAccess: { read: [], create: [], update: [], delete: [] },
      allowAccess: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] },
      registry: [], conditions: {}
    });
  }

  for (const roleId of [managerId, employeeId].filter(Boolean)) {
    policies.push({
      role: roleId, modelName: 'holidays',
      permissions: { read: true, create: false, update: false, delete: false },
      forbiddenAccess: { read: [], create: ['*'], update: ['*'], delete: ['*'] },
      allowAccess: { read: ['*'], create: [], update: [], delete: [] },
      registry: [], conditions: {}
    });
  }

  // ── upsert all ────────────────────────────────────────────────────────────

  const PolicyModel = mongoose.model('accesspolicies');
  let upserted = 0;

  for (const p of policies) {
    await PolicyModel.findOneAndUpdate(
      { role: p.role, modelName: p.modelName },
      { $set: p },
      { upsert: true, new: true }
    );
    upserted++;
  }

  console.log(`✅ Seeded ${upserted} payroll access policies.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
