/**
 * Registry: isHR
 * Checks if the current user has HR role
 */
export default function isHR(user, record, context = {}) {
  if (!user) return false;
  
  // Check role ID (from your system)
  if (user.role === '68d8b980f397d1d97620ba96') {
    return true;
  }
  
  // Check role name if populated
  if (user.roleName && user.roleName.toLowerCase() === 'hr') {
    return true;
  }
  
  // Check role object if populated
  if (user.role?.name && user.role.name.toLowerCase() === 'hr') {
    return true;
  }
  
  return false;
}