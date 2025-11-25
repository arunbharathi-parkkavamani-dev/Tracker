import AuditLog from "../models/AuditLog.js";

/**
 * @param {Object} params
 * {
 *   action: "update" | "delete",
 *   modelName,
 *   userId,
 *   role,
 *   docId,
 *   beforeDoc,
 *   afterDoc,
 *   ip,
 *   metadata
 * }
 */
export async function saveAuditLog({
  action,
  modelName,
  userId,
  role,
  docId,
  beforeDoc = {},
  afterDoc = {},
  ip = null,
  metadata = {}
}) {
  const before = extractChanged(beforeDoc, afterDoc);
  const after = extractChanged(afterDoc, beforeDoc);

  if (!before || !after || Object.keys(before).length === 0) return; // avoid noise (no change)

  return AuditLog.create({
    model: modelName,
    docId,
    action,
    userId,
    role,
    ip,
    before,
    after,
    metadata
  });
}

/** compare only differing fields — avoids whole object storage */
function extractChanged(objA, objB) {
  const diff = {};
  for (const key in objA) {
    if (JSON.stringify(objA[key]) !== JSON.stringify(objB[key])) {
      diff[key] = objA[key];
    }
  }
  return diff;
}
