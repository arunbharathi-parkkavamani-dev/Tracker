// utils/accessCheck.js
import policyEngine from "./policyEngine.js";

export function canRead(role, model, field, reqUser, targetDoc) {
  const policy = policyEngine.getPolicy(role, model);
  if (policy === "*") return true;

  if (policyEngine.isSelfAllowed(policy.read, reqUser, targetDoc)) return true;

  if (policy.read?.allow === "*") return true;
  if (policy.read?.expect && !policy.read.expect.includes(field)) return true;

  return policy.read?.allow?.includes(field) || false;
}

export function canUpdate(role, model, field, reqUser, targetDoc) {
  const policy = policyEngine.getPolicy(role, model);
  if (policy === "*") return true;

  if (policyEngine.isSelfAllowed(policy.update, reqUser, targetDoc)) return true;

  if (policy.update?.allow === "*") return true;
  return policy.update?.allow?.includes(field) || false;
}

export function canDelete(role, model, reqUser, targetDoc) {
  const policy = policyEngine.getPolicy(role, model);
  if (policy === "*") return true;

  if (policyEngine.isSelfAllowed(policy.delete, reqUser, targetDoc)) return true;

  return policy.delete === "*" || false;
}