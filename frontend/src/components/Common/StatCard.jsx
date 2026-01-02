import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = "" }) {
  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition ${className}`}>
      
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="p-1">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      <div className="text-2xl font-bold text-black dark:text-white">{value}</div>
      
      {trend && (
        <p className={`text-xs mt-1 font-medium ${
          trendUp ? "text-green-500" : "text-red-500"
        }`}>
          {trend} <span className="text-gray-500 dark:text-gray-400 font-normal">from last month</span>
        </p>
      )}
      
      {subtitle && !trend && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}