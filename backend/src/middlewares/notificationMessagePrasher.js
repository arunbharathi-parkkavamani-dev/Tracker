/**
 * Generate notification message based on type/status
 * @param {string} userName - Name of the employee
 * @param {object} options - Additional info for message
 *   options.status -> 'Attendance', 'Leave', 'Overtime', etc.
 *   options.details -> extra details like leaveType or hours
 * @returns {string} - Formatted notification message
 */
export function generateNotification(userName, status, modelName) {
  if (modelName.toLowerCase() === "attendances") {
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
  } else if (modelName.toLowerCase() === 'leaves') {
    return `${userName} has request ${status?.leaveName} for ${status?.leaveReason}`;
  }
}
