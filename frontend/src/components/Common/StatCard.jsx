import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, colors }) {
  const bgColor = colors ? colors[0] : '#6b7280';
  
  return (
    <div 
      className="p-4 rounded-lg text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.08)] dark:hover:shadow-[0_12px_40px_rgb(255,255,255,0.12)] border border-gray-200 dark:border-gray-700 flex items-center gap-4 cursor-pointer min-w-[250px] max-w-[250px] transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      style={{ backgroundColor: bgColor }}
    >
      {/* Icon */}
      <div className="bg-white/20 p-3 rounded-lg shadow-[0_4px_15px_rgb(0,0,0,0.2)]">
        <Icon size={28} color="#fff" />
      </div>

      {/* Text */}
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs opacity-75">{subtitle}</p>
      </div>
    </div>
  );
}
