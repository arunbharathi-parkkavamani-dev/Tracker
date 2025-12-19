import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, colors }) {
  const gradient = `linear-gradient(135deg, ${colors.join(", ")})`;

  return (
    <div
      className="p-4 rounded-xl text-white shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-4 cursor-pointer min-w-[250px] max-w-[250px] transition-transform hover:scale-105 duration-300"

      style={{ background: gradient }}
    >
      {/* Icon */}
      <div className="bg-white/20 p-3 rounded-lg">
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
