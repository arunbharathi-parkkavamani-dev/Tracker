import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';

/**
 * Fetches dashboard data based on which widgets are enabled for the user.
 *
 * Instead of fetching by "variant" (hardcoded role shape), this hook inspects
 * the `enabledWidgets` Set and fetches only the data those widgets need.
 *
 * Props:
 *   enabledWidgets — Set<string> from useWidgetPermissions
 *   userId         — current user's _id
 */
export function useDashboardData({ enabledWidgets, userId }) {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived flags — what data do enabled widgets need?
  const needsEmployeeAttendance =
    enabledWidgets.has('stat_attendance_status') ||
    enabledWidgets.has('stat_my_tasks') ||
    enabledWidgets.has('stat_leave_balance') ||
    enabledWidgets.has('priority_tasks') ||
    enabledWidgets.has('recent_activity');

  const needsOrgStats =
    enabledWidgets.has('stat_total_employees') ||
    enabledWidgets.has('stat_present_today') ||
    enabledWidgets.has('stat_on_leave');

  const needsPendingLeaves =
    enabledWidgets.has('stat_pending_leaves') ||
    enabledWidgets.has('pending_leaves_list');

  useEffect(() => {
    if (!userId || enabledWidgets.size === 0) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const requests = [];

        // Personal attendance (employee widgets)
        if (needsEmployeeAttendance) {
          requests.push(
            axiosInstance.post('/populate/read/attendances', {
              filter: {
                employee: userId,
                date: { $gte: new Date().toISOString().split('T')[0] },
              },
            })
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        // Personal leaves
        if (enabledWidgets.has('stat_leave_balance') || enabledWidgets.has('stat_attendance_status')) {
          requests.push(
            axiosInstance.post('/populate/read/leaves', { filter: { employeeId: userId } })
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        // Personal tasks count
        if (enabledWidgets.has('stat_my_tasks')) {
          requests.push(
            axiosInstance.post('/populate/read/tasks', {
              filter: { assignedTo: userId, status: { $ne: 'Completed' } },
              limit: 0,
            })
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        // Org-level employees
        if (needsOrgStats) {
          requests.push(axiosInstance.post('/populate/read/employees', { limit: 0 }));
        } else {
          requests.push(Promise.resolve(null));
        }

        // Org-level attendance (for present today / on leave)
        if (needsOrgStats) {
          requests.push(
            axiosInstance.post('/populate/read/attendances', {
              filter: {
                date: {
                  $gte: `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`,
                },
              },
            })
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        // Pending leaves list
        if (needsPendingLeaves) {
          requests.push(
            axiosInstance.post('/populate/read/leaves', {
              filter: { status: 'Pending' },
              limit: 5,
            })
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        const [attRes, leavesRes, tasksRes, empRes, orgAttRes, pendingLeavesRes] =
          await Promise.all(requests);

        // Build stats object from whatever was fetched
        const attendance = attRes?.data?.data?.[0];
        const myLeaves = leavesRes?.data?.data || [];
        const allEmployees = empRes?.data?.data || [];
        const todayAttendance = orgAttRes?.data?.data || [];
        const pendingLeaveDocs = pendingLeavesRes?.data?.data || [];

        setStats({
          // Employee widgets
          attendanceStatus:
            attendance?.checkIn && !attendance?.checkOut
              ? 'check-in'
              : attendance?.checkOut
              ? 'check-out'
              : 'not-started',
          pendingLeaves: myLeaves.filter((l) => l.status === 'Pending').length,
          leaveBalance: 2,
          myTasks: (tasksRes?.data?.data || []).length,

          // Org widgets
          totalEmployees: allEmployees.length,
          presentToday: todayAttendance.filter((a) => a.status === 'Present').length,
        });

        setPendingLeaves(pendingLeaveDocs);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify([...enabledWidgets].sort())]);

  return { stats, pendingLeaves, loading };
}
