import React, { useEffect, useRef } from "react";

const FloatingCard = ({ task, onClose }) => {
  const cardRef = useRef();

  // Close on Esc key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!task) return null;

  return (
     <div className="fixed inset-0 z-50 flex justify-center items-start p-4">
      {/* DIMMED BACKGROUND */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }} // semi-transparent black
      />

      {/* CARD */}
      <div
        ref={cardRef}
        className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg z-10"
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-2">{task.taskType?.name}</h2>
        <p className="text-gray-600 mb-1">Client: {task.client?.name}</p>
        <p className="text-gray-600 mb-1">Project: {task.projectType?.name}</p>
        <p className="text-gray-600 mb-1">User: {task.user?.basicInfo?.firstName}</p>
        <p className="text-gray-600 mb-1">Description : {task.activity}</p>
        <p className="text-gray-400 mt-2">{new Date(task.date).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default FloatingCard;
