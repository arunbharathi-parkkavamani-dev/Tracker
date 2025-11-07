// src/components/FloatingCard.jsx
import React, { useEffect, useRef } from "react";

const FloatingCard = ({ onClose, children }) => {
  const cardRef = useRef();

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
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
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [onClose]);


  return (
    <div className="fixed inset-0 z-20 bg-black/10 flex justify-center items-start p-4 ">
      {/* Soft blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm transition-all duration-300 w-full" />
      <div
        ref={cardRef}
        className="relative bg-white rounded-2xl shadow-xl z-10 p-4  w-100 h-146 overflow-y-scroll scrollbar-hide"
      >
        {children}
      </div>
    </div>
  );
};

export default FloatingCard;
