// src/components/Task.jsx
import React from "react";

const Task = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        onClick={onClose}
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-2">{task.taskType?.name}</h2>

      <div className="space-y-1 text-gray-700">
        <p>
          <span className="font-medium">Client:</span> {task.client?.name}
        </p>
        <p>
          <span className="font-medium">Project:</span> {task.projectType?.name}
        </p>
        <p>
          <span className="font-medium">User:</span>{" "}
          {task.user?.basicInfo?.firstName}
        </p>
        <p>
          <span className="font-medium">Description:</span> {task.activity}
        </p>
        <p className="text-gray-400 mt-2">
          {new Date(task.date).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Task;
