import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';

export default function V2EmployeeLeaveBalance({ leaveBalance = [] }) {
  return (
    <section className="lmx-section-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4 border-b border-hairline-soft pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--module-accent)]" />
          <h3 className="text-sm font-semibold text-ink tracking-tight uppercase">
            📅 Leave Balance
          </h3>
        </div>
        <Link
          to="/Attendance/leave-regularization"
          className="text-xs font-semibold text-[var(--module-accent)] hover:underline flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Apply Leave
        </Link>
      </div>

      {leaveBalance.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-ink-subtle text-center">
          <Calendar className="h-8 w-8 mb-2" />
          <p className="text-xs">No leave balances found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaveBalance.map((item, idx) => {
            const total = item.available + item.usedThisYear;
            const pct = total > 0 ? (item.available / total) * 100 : 100;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink">{item.leaveType}</span>
                  <span className="text-ink-muted">
                    {item.available}/{total > 0 ? total : item.available} days
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
