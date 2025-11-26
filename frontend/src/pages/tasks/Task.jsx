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

  /** 🔐 Permission logic */
  const canEdit =
    task.createdBy?._id === user.id ||
    task.assignedTo?.some((u) => u._id === user.id);

  /** 🟢 Prepare default form values */
  const initialData = useMemo(() => {
    return {
      clientName: task.client ? { _id: task.client._id, name: task.client.name } : null,
      projectType: task.projectType
        ? { _id: task.projectType._id, name: task.projectType.name }
        : null,
      taskType: task.taskType ? { _id: task.taskType._id, name: task.taskType.name } : null,
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

  /** 💾 Save edit */
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
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
      };

      await axiosInstance.put(
        `/populate/update/tasks/${task._id}`,
        payload,
        { withCredentials: true }
      );

      setSaving(false);
      setIsEditing(false);
      onClose(); // modal closes → Tasks index refreshes
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert("Update failed.");
    }
  };

  return (
    <div className="relative bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl grid grid-cols-3 gap-6">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
        onClick={onClose}
      >
        ✕
      </button>

      {/* LEFT PANEL */}
      <div className="col-span-2 space-y-4">
        {/* Title + Status Badge */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{task.title}</h2>

          <span
            style={{
              backgroundColor: STATUS_COLORS[task.status],
              color: "white",
              borderRadius: "6px",
              fontSize: "12px",
              padding: "4px 10px",
            }}
          >
            {task.status}
          </span>
        </div>

        {!isEditing ? (
          /** VIEW MODE */
          <div className="space-y-4">
            <p><strong>User Story:</strong> {task.userStory || "—"}</p>
            <p><strong>Observation:</strong> {task.observation || "—"}</p>
            <p><strong>Impacts:</strong> {task.impacts || "—"}</p>
            <p><strong>Acceptance criteria:</strong> {task.acceptanceCreteria || "—"}</p>
          </div>
        ) : (
          /** EDIT MODE */
          <FormRenderer
            fields={TaskForm}
            data={initialData}
            submitButton={{ text: saving ? "Saving..." : "Save", color: "green" }}
            onSubmit={handleUpdate}
          />
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="border-l pl-6 space-y-4">
        {canEdit && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-md text-white ${
              isEditing ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isEditing ? "Cancel Edit" : "Edit Task"}
          </button>
        )}

        <p><strong>Client:</strong> {task.client?.name}</p>
        <p><strong>Project:</strong> {task.projectType?.name}</p>
        <p><strong>Created by:</strong> {task.createdBy?.basicInfo?.firstName}</p>

        <p><strong>Priority:</strong> {task.priorityLevel}</p>

        <p><strong>Tags:</strong> {task.tags?.join(", ") || "—"}</p>

        <p><strong>Start date:</strong> {task.startDate ? new Date(task.startDate).toLocaleDateString() : "—"}</p>

        <p><strong>End date:</strong> {task.endDate ? new Date(task.endDate).toLocaleDateString() : "—"}</p>
      </div>
    </div>
  );
};

export default Task;
