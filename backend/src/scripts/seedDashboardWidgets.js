#!/usr/bin/env node
// scripts/seedDashboardWidgets.js
//
// Seeds DashboardWidget documents for all active roles based on role.level.
// RULE: Zero hardcoded role names — only uses level ranges.
//
// Usage:
//   node backend/src/scripts/seedDashboardWidgets.js
//
// Or integrate into the existing seed-model-policies flow.
// This is idempotent — existing documents are upserted (merged, not overwritten).

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

import Role from '../models/Role.js';
import DashboardWidget from '../models/DashboardWidget.js';
import connectDB from '../Config/ConnectDB.js';

// ─── Level → Widget ID mapping (no role names) ───────────────────────────────

function getWidgetsForLevel(level) {
  // V1 widgets (preserved for backward compatibility)
  const v1Employee = [
    'stat_attendance_status', 'stat_leave_balance', 'stat_my_tasks',
    'quick_actions', 'priority_tasks', 'recent_activity'
  ];
  const v1Manager = [
    ...v1Employee, 'stat_total_employees', 'stat_present_today',
    'stat_on_leave', 'stat_pending_leaves', 'pending_leaves_list', 'recent_tasks_table'
  ];
  const v1Admin = [...v1Manager];

  // V2 widgets by level range
  const v2Employee = [
    'v2_employee_header', 'v2_employee_tasks', 'v2_employee_leave_balance'
  ];

  const v2Manager = [
    ...v2Employee,
    'v2_alert_banner', 'v2_workforce_pulse', 'v2_action_center',
    'v2_stat_pending_approvals', 'v2_stat_overdue_tasks', 'v2_stat_open_tickets',
    'v2_team_attendance_grid',
    'asset_pending_approval', 'asset_pending_return'
  ];

  const v2Admin = [
    ...v2Manager,
    'v2_stat_attendance_issues', 'v2_stat_payroll_status',
    // Asset Management — Phase 1, 2, 3
    'asset_total_count', 'asset_available_count',
    'asset_allocated_count', 'asset_clearance_pending', 'asset_recovery_pending',
  ];

  const v2Executive = [
    ...v2Admin,
    'v2_stat_payroll_cost',
    // Asset Management — Phase 1
    // (inherited from v2Admin via spread)
  ];

  const v2MD = [
    ...v2Executive,
    'v2_stat_workforce_health', 'v2_stat_financial_exposure',
    // Asset Management — Phase 1
    // (inherited from v2Executive via spread)
  ];

  // ── Phase 2+ Asset Widgets (not yet active — add to arrays when Phase 2 ships) ──
  // 'asset_pending_approval'   — Level 4+  — assetallocations WHERE status=Pending Approval
  // 'asset_allocated_count'    — Level 7+  — assets WHERE status=Allocated
  // 'asset_pending_return'     — Level 4+  — assetallocations WHERE expectedReturn < today
  // 'asset_clearance_pending'  — Level 7+  — terminating employees with active allocations
  // 'asset_recovery_pending'   — Level 7+  — assetincidents with approved undeducted recovery

  if (level >= 10) return { v1: v1Admin, v2: v2MD };
  if (level >= 9) return { v1: v1Admin, v2: v2Executive };
  if (level >= 7) return { v1: v1Admin, v2: v2Admin };
  if (level >= 4) return { v1: v1Manager, v2: v2Manager };
  return { v1: v1Employee, v2: v2Employee };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to database...');
  await connectDB();

  console.log('📋 Fetching active roles...');
  const roles = await Role.find({ isActive: true }).lean();

  if (roles.length === 0) {
    console.log('⚠️  No active roles found. Nothing to seed.');
    process.exit(0);
  }

  console.log(`   Found ${roles.length} active roles.\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const role of roles) {
    const level = role.level || 1;
    const { v1, v2 } = getWidgetsForLevel(level);
    const allWidgets = [...new Set([...v1, ...v2])]; // deduplicate

    const existing = await DashboardWidget.findOne({ role: role._id }).lean();

    if (existing) {
      // Merge: add new V2 widgets without removing existing V1 customizations
      const existingSet = new Set(existing.widgets || []);
      const newWidgets = allWidgets.filter(w => !existingSet.has(w));

      if (newWidgets.length > 0) {
        const merged = [...existingSet, ...newWidgets];
        await DashboardWidget.updateOne(
          { role: role._id },
          { $set: { widgets: merged } }
        );
        console.log(`   ✅ ${role.name} (level ${level}): merged ${newWidgets.length} new widgets → ${merged.length} total`);
        updated++;
      } else {
        console.log(`   ⏭️  ${role.name} (level ${level}): already up-to-date (${existing.widgets.length} widgets)`);
        skipped++;
      }
    } else {
      await DashboardWidget.create({ role: role._id, widgets: allWidgets });
      console.log(`   🆕 ${role.name} (level ${level}): created with ${allWidgets.length} widgets`);
      created++;
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log('✅ Dashboard widget seeding complete.');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
