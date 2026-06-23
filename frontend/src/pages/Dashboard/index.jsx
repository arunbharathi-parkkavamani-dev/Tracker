import React from 'react';
import { Users, UserCheck, Ban, Calendar, Clock, CheckSquare } from 'lucide-react';
import { MODULES } from '../../constants/uiTokens';
import { useAuth } from '../../context/authProvider';
import { useUserRole } from '../../hooks/useUserRole';

import { getRoleConfig } from './config/dashboardConfig';
import { useWidgetPermissions } from './hooks/useWidgetPermissions';
import { useDashboardData } from './hooks/useDashboardData';

import DashboardLoader from './components/DashboardLoader';
import DashboardHero from './components/DashboardHero';
import QuickActions from './components/QuickActions';
import PendingLeaves from './components/PendingLeaves';

import StatCard from '../../components/Common/StatCard';
import TableGenerator from '../../components/Common/TableGenerator';
import PriorityTasks from '../../components/Common/PriorityTasks';
import RecentActivity from '../../components/role/Employee/RecentActivity';

/**
 * Dashboard — fully widget-driven.
 *
 * What renders is determined by the user's role widget config stored in the DB
 * (managed via Settings → Role Permissions → Dashboard Widgets tab).
 *
 * Adding a new role or changing what a role sees = zero JSX changes here.
 * Just update the DB via the Role Permissions page.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const userId = user?.id || user?._id;

  // 1. Resolve quick-actions / hero buttons from code config (still role-driven for nav links)
  const roleConfig = getRoleConfig(userRole);

  // 2. Fetch which widgets this role is allowed to see from the DB
  const { can, widgets: enabledWidgets, loading: widgetsLoading, hasConfig } = useWidgetPermissions(user?.role);

  // 3. Fetch only the data the enabled widgets actually need
  const { stats, pendingLeaves, loading: dataLoading } = useDashboardData({
    enabledWidgets,
    userId,
  });

  const loading = roleLoading || widgetsLoading || dataLoading;

  if (loading) return <DashboardLoader />;

  // If role has no widget config yet — show a sensible empty state
  if (!hasConfig && !roleLoading && !widgetsLoading) {
    return (
      <div className="space-y-6 animate-fade-in" data-module={MODULES.project.id}>
        <DashboardHero
          userName={user?.name}
          heroActions={roleConfig.heroActions}
          stats={stats}
        />
        <div className="lmx-section-card p-10 flex flex-col items-center text-center gap-3">
          <div className="lmx-icon-tile w-fit p-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink">No dashboard widgets configured</h3>
          <p className="text-sm text-ink-muted max-w-sm">
            An administrator needs to enable dashboard widgets for the <strong>{userRole}</strong> role
            in <strong>Settings → Role Permissions → Dashboard Widgets</strong>.
          </p>
        </div>
      </div>
    );
  }

  const onLeave = (stats?.totalEmployees || 0) - (stats?.presentToday || 0);

  // — Org stat cards —
  const orgStats = [
    can('stat_total_employees') && (
      <StatCard key="total_emp" title="Total Employees" value={stats?.totalEmployees || 0} icon={Users} color="blue" loading={dataLoading} />
    ),
    can('stat_present_today') && (
      <StatCard key="present" title="Present Today" value={stats?.presentToday || 0} icon={UserCheck} color="green" loading={dataLoading} />
    ),
    can('stat_on_leave') && (
      <StatCard key="on_leave" title="On Leave" value={onLeave} icon={Ban} color="yellow" loading={dataLoading} />
    ),
    can('stat_pending_leaves') && (
      <StatCard key="pend_leaves" title="Pending Leaves" value={pendingLeaves.length} icon={Calendar} color="orange" loading={dataLoading} />
    ),
  ].filter(Boolean);

  // — Employee stat cards —
  const employeeStats = [
    can('stat_attendance_status') && (
      <StatCard
        key="att_status"
        title="Today's Attendance"
        value={
          stats?.attendanceStatus === 'check-in' ? 'Checked In'
          : stats?.attendanceStatus === 'check-out' ? 'Checked Out'
          : 'Not Started'
        }
        icon={Clock}
        color={
          stats?.attendanceStatus === 'check-in' ? 'green'
          : stats?.attendanceStatus === 'check-out' ? 'yellow'
          : 'red'
        }
        loading={dataLoading}
      />
    ),
    can('stat_leave_balance') && (
      <StatCard key="leave_bal" title="Leave Balance" value={stats?.leaveBalance || 0} subtitle="days remaining" icon={Calendar} color="yellow" loading={dataLoading} />
    ),
    can('stat_my_tasks') && (
      <StatCard key="my_tasks" title="My Tasks" value={stats?.myTasks || 0} subtitle="assigned to me" icon={CheckSquare} color="blue" loading={dataLoading} />
    ),
  ].filter(Boolean);

  const hasOrgStats = orgStats.length > 0;
  const hasEmployeeStats = employeeStats.length > 0;
  const hasLeftPanel = can('quick_actions') || can('recent_tasks_table') || can('priority_tasks');
  const hasRightPanel = can('pending_leaves_list') || can('recent_activity');

  return (
    <div className="space-y-6 animate-fade-in" data-module={MODULES.project.id}>
      {/* Hero — always shown */}
      <DashboardHero
        userName={user?.name}
        heroActions={roleConfig.heroActions}
        stats={stats}
      />

      {/* Org-level stat row */}
      {hasOrgStats && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(orgStats.length, 4)} gap-5`}>
          {orgStats}
        </div>
      )}

      {/* Employee stat row */}
      {hasEmployeeStats && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(employeeStats.length, 3)} gap-5`}>
          {employeeStats}
        </div>
      )}

      {/* Main panels grid */}
      {(hasLeftPanel || hasRightPanel) && (
        <div className={`grid grid-cols-1 ${hasRightPanel ? 'lg:grid-cols-3' : ''} gap-6`}>
          {/* Left / main column */}
          {hasLeftPanel && (
            <div className={`${hasRightPanel ? 'lg:col-span-2' : ''} space-y-6`}>
              {can('quick_actions') && <QuickActions actions={roleConfig.quickActions} />}
              {can('recent_tasks_table') && (
                <TableGenerator
                  model="tasks"
                  title="Recent Tasks"
                  searchable
                  sortable
                  pagination={false}
                  className="max-h-[320px]"
                  autoRefresh
                  refreshInterval={30000}
                />
              )}
              {can('priority_tasks') && <PriorityTasks />}
            </div>
          )}

          {/* Right sidebar column */}
          {hasRightPanel && (
            <div className="space-y-6">
              {can('pending_leaves_list') && <PendingLeaves leaves={pendingLeaves} />}
              {can('recent_activity') && <RecentActivity />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
