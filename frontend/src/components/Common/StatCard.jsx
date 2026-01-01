import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-zinc-900
                    border border-gray-200 dark:border-zinc-800
                    rounded-xl p-4 shadow-sm hover:shadow-md transition">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800">
          <Icon size={18} className="text-gray-600 dark:text-gray-300" />
        </div>
      </div>

      <p className="text-2xl font-semibold mt-3">{value}</p>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}