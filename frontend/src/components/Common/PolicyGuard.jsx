import React from "react";
import { useUserRole } from "../../hooks/useUserRole";

/**
 * A higher-order wrapper component that only renders its children 
 * if the current user has the required permission for a specific model,
 * OR if their role matches one of the fallback requiredRoles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The UI elements to render if authorized.
 * @param {string} [props.model] - The model name (e.g., 'clients').
 * @param {'read'|'create'|'update'|'delete'} [props.action] - The action to check.
 * @param {string[]} [props.requiredRoles] - (Legacy fallback) Array of allowed roles, e.g. ['hr admin', 'admin']
 * @param {React.ReactNode} [props.fallback] - Optional UI to render if unauthorized.
 */
const PolicyGuard = ({ children, model, action, requiredRoles = [], fallback = null }) => {
  const { userRole, policies, loading } = useUserRole();

  if (loading) {
    return null; // Or a small spinner if preferred
  }

  const roleLower = (userRole || '').toLowerCase();
  
  // Super Admin bypass
  if (roleLower === 'super admin' || roleLower === 'admin') {
     return <>{children}</>;
  }

  let isAuthorized = false;

  // 1. Check dynamic policies if model and action are provided
  if (model && action && policies && policies[model]) {
      isAuthorized = !!policies[model][action];
  } 
  // 2. Fallback to hardcoded roles if provided
  else if (requiredRoles && requiredRoles.length > 0) {
      isAuthorized = requiredRoles.includes(roleLower);
  }

  if (!isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
};

export default PolicyGuard;
