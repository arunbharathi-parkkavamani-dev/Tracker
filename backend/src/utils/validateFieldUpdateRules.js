// src/utils/validateFieldUpdateRules.js
//
// FINAL SECURITY GATE before update hits DB.
// Even if sanitizeUpdate allowed some fields,
// this prevents changing the identity / ownership / control fields.
//

export default function validateFieldUpdateRules({ body, modelName, role, userId }) {
  if (!body || typeof body !== "object") return;

  // 🔥 List of fields that must NEVER change regardless of role
  const globalLockedFields = [
    "_id",
    "id",
    "role",
    "permissions",
    "deleted",
    "deletedAt",
    "deletedBy",
    "createdAt",
    "updatedAt",
  ];

  for (const field of Object.keys(body)) {
    if (field in body && globalLockedFields.includes(field)) {
      throw new Error(`⛔ Field "${field}" cannot be modified`);
    }
  }

  // 🧩 Model-specific high-risk blocked fields (HR/Admin specific)
  const modelLockedFields = {
    employees: ["employeeId", "authInfo", "salaryDetails"],
    attendance: ["employee", "approvalBy", "approvedAt"],
    leave: ["employee", "approvalBy", "approvedAt", "leavePolicy"],
    departments: ["leavePolicy"],
  };

  if (modelLockedFields[modelName]) {
    for (const field of Object.keys(body)) {
      if (modelLockedFields[modelName].some(f => match(field, f))) {
        throw new Error(`⛔ Update not allowed on protected field "${field}"`);
      }
    }
  }

  // 🧠 Optional advanced checks
  // - Authorization downgrade / privilege escalation
  if (body?.authInfo?.password || body?.authInfo?.otp) {
    throw new Error(`⛔ Auth fields cannot be modified through UPDATE`);
  }

  // - Salary updates invisible to HR rules
  if (body?.salaryDetails && role !== "hr" && role !== "admin") {
    throw new Error(`⛔ Salary updates allowed only for HR/Admin roles`);
  }

  // - Prevent changing record ownership unless privileged
  if (body?.createdBy && body?.createdBy !== userId) {
    throw new Error(`⛔ Changing "createdBy" is not allowed`);
  }

  return true; // pass
}


/** ------------------------------------------------------------
 * Dot-notation match helper
 * ------------------------------------------------------------ */
function match(field, rule) {
  return field === rule || field.startsWith(rule + ".") || rule.startsWith(field + ".");
}
    