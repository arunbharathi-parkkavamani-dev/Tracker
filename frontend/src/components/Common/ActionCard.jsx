import React from "react";
import { Link } from "react-router-dom";

export default function ActionCard({ title, icon: Icon, to, colors }) {
  const gradient = colors
    ? `linear-gradient(135deg, ${colors.join(", ")})`
    : "linear-gradient(135deg, #4f46e5, #3b82f6)"; // default gradient

  return (
    <Link
      to={to}
      className="cursor-pointer p-4 rounded-xl shadow-md flex items-center gap-4 
                 hover:scale-105 transition-all text-white min-w-[250px] max-w-[250px]"
      style={{ background: gradient }}
    >
      {/* Icon */}
      <div className="bg-white/20 p-3 rounded-lg">
        <Icon size={28} color="#fff" />
      </div>

      {/* Title */}
      <p className="text-lg font-semibold">{title}</p>
    </Link>
  );
}
