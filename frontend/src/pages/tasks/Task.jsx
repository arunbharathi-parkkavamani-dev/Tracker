import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import FormRenderer from "../../components/Common/FormRenderer";
import TaskForm from "../../constants/taskForm";

const STATUS_COLORS = {
  Backlogs: "#000000",
  "To Do": "#FFA500",
  "In Progress": "#FF8A8A",
  "In Review": "#3B82F6",
  Approved: "#6EE7B7",
  Rejected: "#B91C1C",
  Completed: "#166534",
};

const Task = ({ task, onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  /** Permission */
  const canEdit =
    task.createdBy?._id === user.id ||
    task.assignedTo?.some((u) => u._id === user.id);

  /** Prepare edit defaults */
  const initialData = useMemo(() => {
    return {
      clientName: task.clientId
        ? { _id: task.clientId._id, name: task.clientId.name }
        : null,
      projectType: task.projectTypeId
        ? { _id: task.projectTypeId._id, name: task.projectTypeId.name }
        : null,
      taskType: task.taskTypeId
        ? { _id: task.taskTypeId._id, name: task.taskTypeId.name }
        : null,
      title: task.title || "",
      referenceUrl: task.referenceUrl || "",
      userStory: task.userStory || "",
      observation: task.observation || "",
      impacts: task.impacts || "",
      acceptanceCreteria: task.acceptanceCreteria || "",
      priorityLevel: task.priorityLevel || "",
      startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "",
      endDate: task.endDate ? new Date(task.endDate).toISOString().slice(0, 10) : "",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
    };
  }, [task]);

  /** Save */
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        clientId: formData.clientName._id,
        projectTypeId: formData.projectType._id,
        taskTypeId: formData.taskType._id,
        title: formData.title,
        referenceUrl: formData.referenceUrl,
        userStory: formData.userStory,
        observation: formData.observation,
        impacts: formData.impacts,
        acceptanceCreteria: formData.acceptanceCreteria,
        priorityLevel: formData.priorityLevel,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      };

      await axiosInstance.put(`/populate/update/tasks/${task._id}`, payload);
      setSaving(false);
      setIsEditing(false);
      onClose(); // Parent refreshes
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert("Update failed.");
    }
  };

  return (
    <div className="relative bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl overflow-y-auto max-h-[90vh]">
      {/* Close button */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Title & Status */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">{task.title}</h2>
        <span
          style={{
            backgroundColor: STATUS_COLORS[task.status],
            color: "white",
            borderRadius: "6px",
            fontSize: "12px",
            padding: "5px 12px",
          }}
        >
          {task.status}
        </span>
      </div>

      {/* EDIT MODE */}
      {isEditing ? (
        <FormRenderer
          fields={TaskForm}
          data={initialData}
          submitButton={{ text: saving ? "Saving..." : "Save", color: "green" }}
          onSubmit={handleUpdate}
        />
      ) : (
        /* VIEW MODE — Zoho Style Layout */
        <div className="grid grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-4">
            <p><strong>User Story:</strong> {task.userStory || "—"}</p>
            <p><strong>Observation:</strong> {task.observation || "—"}</p>
            <p><strong>Impacts:</strong> {task.impacts || "—"}</p>
            <p><strong>Acceptance Criteria:</strong> {task.acceptanceCreteria || "—"}</p>

            {task.referenceUrl && (
              <p>
                <strong>Reference URL:</strong>{" "}
                <a href={task.referenceUrl} className="text-blue-600 underline" target="_blank">
                  {task.referenceUrl}
                </a>
              </p>
            )}
          </div>

          {/* Right */}
          <div className="space-y-3 border-l pl-6">
            <p><strong>Client:</strong> {task.clientId?.name}</p>
            <p><strong>Project Type:</strong> {task.projectTypeId?.name}</p>
            <p><strong>Task Type:</strong> {task.taskTypeId?.name}</p>
            <p><strong>Created By:</strong> {task.createdBy?.basicInfo?.firstName}</p>
            <p><strong>Priority:</strong> {task.priorityLevel}</p>
            <p><strong>Tags:</strong> {task.tags?.join(", ") || "—"}</p>
            <p><strong>Start Date:</strong> {task.startDate ? new Date(task.startDate).toLocaleDateString() : "—"}</p>
            <p><strong>End Date:</strong> {task.endDate ? new Date(task.endDate).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      )}

      {/* EDIT BUTTON */}
      {canEdit && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          ✏ Edit Task
        </button>
      )}

      {/* CANCEL EDIT BUTTON */}
      {isEditing && (
        <button
          onClick={() => setIsEditing(false)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default Task;
