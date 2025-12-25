// src/utils/registryExecutor.js
import { getRegistry } from "./policy/registry/index.js";

/**
 * Registry evaluator
 *
 * The output of this function is fed back into buildReadQuery
 * and can override fields / filter if necessary.
 *
 * Expected return shape:
 * {
 *   fields,                   // override direct-read fields if registry decides
 *   filter,                   // override filter if registry decides
 *   isPopulationContext,      // true when the read is because of populate
 *   allowedPopulateFields     // list of allowed fields for sanitizePopulated()
 * }
 */
export default async function runRegistry({
  role,
  userId,
  modelName,
  action,
  policy
}) {
  const result = {
    fields: null,
    filter: null,
    isPopulationContext: false,
    allowedPopulateFields: null
  };

  const rules = policy?.conditions?.[action];
  if (!Array.isArray(rules) || rules.length === 0) return result;

  const filters = [];

  // Process every condition entry
  for (const rule of rules) {
    if (!rule.registry) continue;

    const registryFn = getRegistry(rule.registry);
    if (typeof registryFn !== "function") continue; // ignore missing registry

    // Registry functions expect (user, record, context) parameters
    const user = { id: userId, role };
    const record = {}; // This should be populated with actual record data when available
    const context = {
      role,
      userId,
      modelName,
      fields: rule.fields,
      effect: rule.effect,
      action
    };

    let outcome = null;
    try {
      outcome = await registryFn(user, record, context);
    } catch (error) {
      console.warn(`Registry ${rule.registry} failed:`, error.message);
      continue; // lenient skip if registry throws
    }

    // -------------------------------------------------------
    // populateRef implementation contract:
    // - outcome === true  -> request is population context
    // - allowed fields     -> sanitization needed later
    // -------------------------------------------------------
    if (rule.registry === "populateRef" && outcome === true) {
      result.isPopulationContext = true;
      if (Array.isArray(rule.fields) && rule.effect === "allow") {
        result.allowedPopulateFields = rule.fields;
      }
      continue;
    }

    // -------------------------------------------------------
    // Handle registry outcomes
    // -------------------------------------------------------
    if (outcome && typeof outcome === "object" && outcome.filter) {
      filters.push(outcome.filter);
    }
    if (outcome && typeof outcome === "object" && outcome.fields) {
      result.fields = outcome.fields;
    }
  }

  // Combine all filters with $or
  if (filters.length > 0) {
    result.filter = filters.length === 1 ? filters[0] : { $or: filters };
  }

  return result;
}
