// src/utils/sanitizeRead.js

/**
 * Sanitizes requested READ fields based on policy:
 * - remove forbiddenAccess.read
 * - keep only allowAccess.read
 * - supports "*" wildcard
 * - lenient: always returns a safe array
 *
 * @param {Array|string|null} fields - requested fields (from query)
 * @param {Object} policy - model policy JSON
 * @returns {Array} sanitized field list
 */
export default function sanitizeRead({ fields, policy }) {
  // console.log("[sanitizeRead.js:15] Inside sanitizeRead - fields:", fields);

  const forbidden = policy?.forbiddenAccess?.read || [];
  const allowed = policy?.allowAccess?.read || [];

  // If no fields requested but policy allows "*" → return ["*"]
  if (!fields) {
    return allowed.includes("*") ? ["*"] : [];
  }

  // Convert fields string ("a,b,c") → array
  if (typeof fields === "string") {
    fields = fields.split(",").map(f => f.trim()).filter(Boolean);
  }

  // Force array
  if (!Array.isArray(fields)) {
    return [];
  }

  let sanitized = [...fields];

  /** --------------------------------------------------
   * 1) Remove forbidden fields
   * -------------------------------------------------- */
  if (Array.isArray(forbidden) && forbidden.length > 0) {
    sanitized = sanitized.filter(
      (f) => !forbidden.some((deny) => matchField(f, deny))
    );
  }

  /** --------------------------------------------------
   * 2) Apply allowed list rules (only if not wildcard)
   * -------------------------------------------------- */
  if (!allowed.includes("*")) {
    sanitized = sanitized.filter(
      (f) => allowed.some((allow) => matchField(f, allow))
    );
  }

  // Return the sanitized requested fields (no fallback to wildcard)
  return sanitized;
}

/**
 * dot-notation matcher
 * - exact match OR nested match
 *   Ex: deny "authInfo" blocks "authInfo.workEmail" and vice-versa
 */
function matchField(requested, ruleField) {
  if (requested === ruleField) return true;
  if (requested.startsWith(ruleField + ".")) return true;
  if (ruleField.startsWith(requested + ".")) return true;
  return false;
}
