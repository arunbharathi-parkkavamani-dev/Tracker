import {
  CheckSquare,
  Clock,
  Calendar,
  ClipboardList
} from "lucide-react";

import StatCard from "../../Common/StatCard";
import PriorityTasks from "../../Common/PriorityTasks";
import RecentActivity from "./RecentActivity";

export default function EmployeeDashboard({ stats }) {
  return (
    <div className="space-y-8">

      {/* -------- Greeting -------- */}
      <div>
        <h2 className="text-2xl font-semibold">
          Good morning 👋
        </h2>
        <p className="text-gray-500">
          Here’s what’s happening in your workspace today.
        </p>
      </div>

      {/* -------- Stats Grid -------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Attendance"
          value={
            stats?.attendanceStatus === "check-in"
              ? "Checked In"
              : stats?.attendanceStatus === "check-out"
                ? "Checked Out"
                : "Not Started"
          }
          icon={Clock}
        />

        <StatCard
          title="Leave Balance"
          value={stats?.leaveBalance || 0}
          subtitle="days remaining"
          icon={Calendar}
        />

        <StatCard
          title="Active Tasks"
          value={stats?.myTasks || 0}
          subtitle="in progress"
          icon={CheckSquare}
        />

        <StatCard
          title="Completed"
          value={stats?.completedTasks || 0}
          subtitle="this month"
          icon={ClipboardList}
        />
      </div>

      {/* -------- Main Content Grid -------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Priority Tasks */}
        <div className="lg:col-span-2">
          <PriorityTasks />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>

    </div>
  );
}