import axiosInstance from "../../api/axiosInstance";

export const updateTaskById = (taskId, data) =>
  axiosInstance.put(`/populate/update/tasks/${taskId}`, data);
