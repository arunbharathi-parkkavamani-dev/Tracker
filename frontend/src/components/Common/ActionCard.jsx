import React from "react";
import { Link } from "react-router-dom";

export default function ActionCard({ title, icon: Icon, to, colors }) {
  const iconBgColor = colors ? { backgroundColor: colors[0] } : { backgroundColor: '#6b7280' };
  
  return (
    <Link
      to={to}
      className="cursor-pointer p-4 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.08)] dark:hover:shadow-[0_12px_40px_rgb(255,255,255,0.12)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-black dark:text-white min-w-[250px] max-w-[250px]"
    >
      {/* Icon */}
      <div 
        className="p-3 rounded-lg shadow-[0_4px_15px_rgb(0,0,0,0.15)] dark:shadow-[0_4px_15px_rgb(255,255,255,0.1)]"
        style={iconBgColor}
      >
        <Icon size={28} color="#fff" />
      </div>

      {/* Title */}
      <p className="text-lg font-semibold">{title}</p>
    </Link>
  );
}
