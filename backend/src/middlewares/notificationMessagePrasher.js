/**
 * Generate notification message based on type/status
 * @param {string} userName - Name of the employee who triggered the event
 * @param {object} status - Payload for message formatting
 * @param {string} modelName - Type of model (attendances, leaves, tasks, etc.)
 * @returns {string} - Formatted notification message
 */
export function generateNotification(userName, status, modelName) {
  // ==========================================================
  // ATTENDANCE (NO CHANGE — YOUR ORIGINAL CODE)
  // ==========================================================
  if (modelName === "attendances") {
    switch (status) {
      case "Present":
        return `${userName} has checked in for today.`;
      case "Leave":
        return `${userName} applied for leave (${
          status.leaveType || "N/A"
        }), kindly review it.`;
      case "pending":
        return `${userName} requested ${
          status.request || "attendance update"
        }, kindly review it.`;
      case "Overtime":
        return `${userName} requested ${
          status.hours || 0
        } hour(s) overtime, kindly review it.`;
      case "Early check-out":
        return `${userName} has checked out early, kindly review it.`;
      default:
        return `${userName} has requested ${status}`;
    }
  }

  // ==========================================================
  // LEAVES (NO CHANGE — YOUR EXISTING FORMAT)
  // ==========================================================
  if (modelName === "leaves") {
    if (status?.leaveReason) {
      return `${userName} has request ${status?.leaveName} for ${status?.leaveReason}`;
    } else {
      return `${userName} your ${status?.leaveName} has been ${status?.leaveStatus}`;
    }
  }

  // ==========================================================
  // TASKS (NEW)
  // status.type can be: "created", "assigned", "status", "comment"
  // ==========================================================
  if (modelName === "tasks") {
    switch (status?.type) {
      case "created":
        return `${userName} created a new task`;

      case "assigned":
        return `${userName} assigned you to a task`;

      case "status":
        return `${userName} updated task status to ${status.newStatus}`;

      case "comment":
        if (status.isMention) {
          return `${userName} mentioned you in a comment`;
        }
        return `${userName} commented on a task`;

      default:
        return `${userName} updated a task`;
    }
  }

  // ==========================================================
  // FOR FUTURE MODULES — GENERIC FALLBACK
  // ==========================================================
  return `${userName} performed an update`;
}
