// utils/policyEngine.js
import accessPolicies from "../config/accessPolicies.js";

function getPolicy(role, model) {
  const rolePolicy = accessPolicies[role];
  if (!rolePolicy) return null;

  if (rolePolicy === "*") return "*";
  return rolePolicy[model] || null;
}

function isSelfAllowed(policy, reqUser, targetDoc) {
  if (!policy?.self) return false;
  if (!reqUser || !targetDoc) return false;

  return String(reqUser._id) === String(targetDoc._id);
}

export default { getPolicy, isSelfAllowed };