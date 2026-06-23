import {
  Calendar, Clock, Plus, Users, UserPlus,
  FileText, Briefcase, CheckSquare, ClipboardList, LogIn,
} from 'lucide-react';

/**
 * Dynamic dashboard configuration keyed by role name (lowercase).
 *
 * Add a new role here — no JSX changes needed.
 * Each entry defines:
 *   - variant: which data/layout variant to use ("admin" | "manager" | "employee")
 *   - quickActions: links shown in the Quick Actions panel
 *   - heroActions: CTA buttons shown in the hero section
 *
 * The `variant` controls which DashboardBody sub-component renders.
 */

export const ROLE_CONFIG = {
  superadmin: {
    variant: 'admin',
    quickActions: [
      { to: '/Settings', icon: FileText, label: 'Company Settings' },
      { to: '/HR', icon: UserPlus, label: 'Add Employee' },
      { to: '/Attendance/leaves', icon: Calendar, label: 'All Leaves' },
      { to: '/Master-Data', icon: Briefcase, label: 'Master Data' },
    ],
    heroActions: [
      { to: '/tasks', icon: Plus, label: 'My Tasks', variant: 'secondary' },
    ],
  },

  admin: {
    variant: 'admin',
    quickActions: [
      { to: '/Settings', icon: FileText, label: 'Company Settings' },
      { to: '/HR', icon: UserPlus, label: 'Add Employee' },
      { to: '/Attendance/leaves', icon: Calendar, label: 'All Leaves' },
      { to: '/Master-Data', icon: Briefcase, label: 'Master Data' },
    ],
    heroActions: [
      { to: '/tasks', icon: Plus, label: 'My Tasks', variant: 'secondary' },
    ],
  },

  manager: {
    variant: 'manager',
    quickActions: [
      { to: '/Attendance/leaves', icon: Calendar, label: 'Approve Leaves' },
      { to: '/tasks', icon: Plus, label: 'Assign Task' },
      { to: '/Attendance/Daily-tracker', icon: Clock, label: 'Team Tracker' },
      { to: '/HR', icon: Users, label: 'Team Directory' },
    ],
    heroActions: [
      { to: '/tasks', icon: Plus, label: 'My Tasks', variant: 'secondary' },
    ],
  },

  employee: {
    variant: 'employee',
    quickActions: [
      { to: '/Attendance/leaves', icon: Calendar, label: 'Apply Leave' },
      { to: '/tasks/my-tasks', icon: CheckSquare, label: 'View Tasks' },
      { to: '/Attendance/Daily-tracker', icon: Clock, label: 'Daily Tracker' },
      { to: '/Attendance/leave-regularization', icon: ClipboardList, label: 'Regularize' },
    ],
    heroActions: [
      { to: '/Attendance/Daily-tracker', icon: LogIn, label: null, variant: 'primary', dynamic: 'clockLabel' },
      { to: '/tasks', icon: Plus, label: 'My Tasks', variant: 'secondary' },
    ],
  },
};

/** Fallback config for unknown roles — shows read-only hero + tasks button */
export const DEFAULT_ROLE_CONFIG = {
  variant: 'default',
  quickActions: [],
  heroActions: [
    { to: '/tasks', icon: Plus, label: 'My Tasks', variant: 'secondary' },
  ],
};

/** Returns the config for a given role name, falling back to DEFAULT. */
export function getRoleConfig(roleName) {
  if (!roleName) return DEFAULT_ROLE_CONFIG;
  return ROLE_CONFIG[roleName.toLowerCase()] ?? DEFAULT_ROLE_CONFIG;
}

// ─── Widget Registry ──────────────────────────────────────────────────────────
/**
 * WIDGET_REGISTRY — canonical list of all dashboard widgets.
 *
 * The backend stores only the `id` strings per role.
 * This file maps those IDs to display metadata for the settings UI.
 *
 * Groups:
 *   'org'      — org-level stats (admin/manager)
 *   'employee' — personal stats (employee)
 *   'panels'   — list/table panels
 */

export const WIDGET_GROUPS = {
  org:      { label: 'Organisation Stats', color: 'blue' },
  employee: { label: 'My Stats', color: 'green' },
  panels:   { label: 'Panels & Tables', color: 'purple' },
};

export const WIDGET_REGISTRY = [
  // — Org-level stats —
  {
    id: 'stat_total_employees',
    label: 'Total Employees',
    description: 'Count of all active employees',
    group: 'org',
    needsData: ['employees'],
  },
  {
    id: 'stat_present_today',
    label: 'Present Today',
    description: 'Employees checked in today',
    group: 'org',
    needsData: ['attendances'],
  },
  {
    id: 'stat_on_leave',
    label: 'On Leave',
    description: 'Employees currently on leave',
    group: 'org',
    needsData: ['employees', 'attendances'],
  },
  {
    id: 'stat_pending_leaves',
    label: 'Pending Leave Count',
    description: 'Number of pending leave approvals',
    group: 'org',
    needsData: ['leaves'],
  },

  // — Personal stats —
  {
    id: 'stat_attendance_status',
    label: 'Attendance Status',
    description: "Today's check-in / check-out status",
    group: 'employee',
    needsData: ['attendances'],
  },
  {
    id: 'stat_leave_balance',
    label: 'Leave Balance',
    description: 'Remaining leave days',
    group: 'employee',
    needsData: ['leaves'],
  },
  {
    id: 'stat_my_tasks',
    label: 'My Tasks',
    description: 'Open tasks assigned to me',
    group: 'employee',
    needsData: ['tasks'],
  },

  // — Panels & tables —
  {
    id: 'quick_actions',
    label: 'Quick Actions',
    description: 'Shortcut links for common actions',
    group: 'panels',
    needsData: [],
  },
  {
    id: 'pending_leaves_list',
    label: 'Pending Leave Requests',
    description: 'List of leaves awaiting approval',
    group: 'panels',
    needsData: ['leaves'],
  },
  {
    id: 'recent_tasks_table',
    label: 'Recent Tasks Table',
    description: 'Paginated table of recent tasks',
    group: 'panels',
    needsData: ['tasks'],
  },
  {
    id: 'priority_tasks',
    label: 'My Priority Tasks',
    description: 'High-priority tasks assigned to me',
    group: 'panels',
    needsData: ['tasks'],
  },
  {
    id: 'recent_activity',
    label: 'Recent Activity Feed',
    description: 'Timeline of recent team activity',
    group: 'panels',
    needsData: [],
  },
];

/** Quick lookup: id → widget definition */
export const WIDGET_MAP = Object.fromEntries(
  WIDGET_REGISTRY.map((w) => [w.id, w])
);
