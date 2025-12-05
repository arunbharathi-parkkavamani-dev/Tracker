import { Calendar, Clock, CheckSquare, FileText, LogIn, LogOut, Loader, ClipboardList } from "lucide-react";
import StatCard from "../../Common/StatCard";
import ActionCard from "../../Common/ActionCard";
import "./Style.css"

export default function EmployeeDashboard({ stats }) {

    const getStatusColor = (status) => {
        switch (status) {
            case 'check-in': return ['#10b981', '#059669'];
            case 'check-out': return ['#6366f1', '#4f46e5'];
            case 'not-started': return ['#f59e0b', '#d97706'];
            default: return ['#6b7280', '#4b5563'];
        }
    };

    return (
        <div className="dark:bg-black dark:text-color-white px-5">

            {/* ---------------------- STAT CARDS IN ONE ROW ---------------------- */}
            <div className="flex gap-4 overflow-x-auto py-4">
                <StatCard
                    title="Attendance"
                    value={
                        stats?.attendanceStatus === 'check-in'
                            ? 'Checked In'
                            : stats?.attendanceStatus === 'check-out'
                                ? 'Checked Out'
                                : 'Not Started'
                    }
                    icon={
                        stats?.attendanceStatus === 'check-in'
                            ? LogIn
                            : stats?.attendanceStatus === 'check-out'
                                ? LogOut
                                : Clock
                    }
                    colors={getStatusColor(stats?.attendanceStatus || 'not-started')}
                />

                <StatCard
                    title="Leave Balance"
                    value={stats?.leaveBalance || 0}
                    icon={Calendar}
                    colors={['#8b5cf6', '#7c3aed']}
                    subtitle={stats?.leaveBalance ? "days remaining" : ""}
                />

                <StatCard
                    title="My Tasks"
                    value={stats?.myTasks || 0}
                    icon={CheckSquare}
                    colors={['#06b6d4', '#0891b2']}
                    subtitle="active tasks"
                />

                <StatCard
                    title="Completed"
                    value={stats?.completedTasks || 0}
                    icon={FileText}
                    colors={['#10b981', '#059669']}
                    subtitle="this month"
                />

                <StatCard
                    title="Monthly Attendance"
                    value={stats?.monthlyAttendance || 0}
                    icon={LogIn}
                    colors={['#f65cf6ff', '#8e3aedff']}
                    subtitle="days remaining"
                />

                <StatCard
                    title="Activity Tasks"
                    value={stats?.dailyActivity || 0}
                    icon={ClipboardList}
                    colors={['#f65cf6ff', '#8e3aedff']}
                    subtitle="today"
                />
            </div>

            {/* ---------------------- ACTION CARDS IN ONE ROW ---------------------- */}
            <p className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</p>

            <div className="flex gap-4 overflow-x-auto py-2">
                <ActionCard
                    title="Check In/Out"
                    icon={Clock}
                    to="/attendance"
                    colors={['#10b981', '#059669']}
                />

                <ActionCard
                    title="Request Leave"
                    icon={Calendar}
                    to="/attendance/add"
                    colors={['#8b5cf6', '#7c3aed']}
                />

                <ActionCard
                    title="My Tasks"
                    icon={CheckSquare}
                    to="/tasks"
                    colors={['#06b6d4', '#0891b2']}
                />

                <ActionCard
                    title="Profile"
                    icon={FileText}
                    to="/me"
                    colors={['#f65cf6ff', '#8e3aedff']}
                />
            </div>
        </div>
    );
}
