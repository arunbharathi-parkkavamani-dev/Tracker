/**
 * Registry: isTeamMember
 * Checks if the record belongs to a team member under the current user's management
 */
export default function isTeamMember(user, record, context = {}) {
  if (!user || !record) return false;
  
  // Check if user is a manager
  if (!user.managerId && user.role !== 'manager') return false;
  
  // For employee records - check if the employee reports to this manager
  if (record.professionalInfo?.reportingManager) {
    return user.id === record.professionalInfo.reportingManager.toString();
  }
  
  // For attendance/leave records - check if the employee reports to this manager
  if (record.employeeId) {
    // This would need to be populated with employee data to check reporting manager
    // For now, we'll use context if available
    if (context.employee?.professionalInfo?.reportingManager) {
      return user.id === context.employee.professionalInfo.reportingManager.toString();
    }
  }
  
  // Check team lead relationship
  if (record.professionalInfo?.teamLead) {
    return user.id === record.professionalInfo.teamLead.toString();
  }
  
  return false;
}