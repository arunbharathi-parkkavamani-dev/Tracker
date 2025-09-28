export function generateAttendanceNotification(userName, request) {
  return `${userName} requested ${request}, kindly review it.`;
}

export function generateLeaveNotification(userName, leaveType) {
  return `${userName} applied for leave (${leaveType}), kindly review it.`;
}
export function generateOvertimeNotification(userName, hours) {
  return `${userName} requested ${hours} hour(s) overtime, kindly review it.`;
}
