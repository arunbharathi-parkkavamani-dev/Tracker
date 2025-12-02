/**
 * Registry: isManager
 * Checks if the current user has Manager role
 */
export default function isManager(user, record, context = {}) {
  if (!user) return false;
  
  // Check role ID (from your system)
  if (user.role === '68d8b8caf397d1d97620ba93') {
    return true;
  }
  
  // Check role name if populated
  if (user.roleName && user.roleName.toLowerCase() === 'manager') {
    return true;
  }
  
  // Check role object if populated
  if (user.role?.name && user.role.name.toLowerCase() === 'manager') {
    return true;
  }
  
  return false;
}