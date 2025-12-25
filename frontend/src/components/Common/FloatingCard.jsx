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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => onClose?.()} 
      />

      {/* CARD */}
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-gray-800 rounded shadow-xl max-h-[90vh] w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-200"
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 group"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* SCROLLABLE CONTENT INSIDE */}
        <div className="overflow-y-auto max-h-[90vh] p-6 text-sm break-words text-black dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export default FloatingCard;
