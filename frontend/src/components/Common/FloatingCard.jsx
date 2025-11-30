// src/components/FloatingCard.jsx
import React, { useEffect, useRef } from "react";

const FloatingCard = ({ onClose, children }) => {
  const cardRef = useRef();

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // 1️⃣ Don't close if click inside MUI popper (dropdown list)
      const inAutocomplete =
        e.target.closest('[role="presentation"]') || // popper wrapper
        e.target.closest('[role="listbox"]'); // dropdown list itself
      if (inAutocomplete) return;

      // 2️⃣ Don't close if click inside card
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => onClose?.()} />

      {/* CARD */}
      <div
        ref={cardRef}
        className="relative bg-white rounded-2xl shadow-2xl max-h-[92vh] w-[60vw] overflow-hidden animate-fadeIn"
      >
        {/* SCROLLABLE CONTENT INSIDE */}
        <div className="overflow-y-auto max-h-[92vh] p-6 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

export default FloatingCard;
