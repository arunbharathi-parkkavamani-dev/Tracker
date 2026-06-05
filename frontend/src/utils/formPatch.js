/** Nested get/set and dirty-field PATCH builder for form updates. */

export function getNestedValue(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

export function setNestedValue(obj, path, value) {
  if (!path) return obj;
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
}

function unwrapValue(val) {
  if (val == null) return val;
  if (Array.isArray(val)) return val.map((v) => unwrapValue(v));
  if (typeof val === "object" && val._id != null) return val._id;
  return val;
}

function normalizeForCompare(val) {
  return unwrapValue(val);
}

export function valuesEqual(a, b) {
  return (
    JSON.stringify(normalizeForCompare(a)) ===
    JSON.stringify(normalizeForCompare(b))
  );
}

/**
 * Build PATCH body with only fields the user changed (flat dot-path keys).
 * @param {object} original - loaded record baseline
 * @param {object} current - current form state
 * @param {string[]} changedFieldNames - keys from FormRenderer changedFields
 */
export function buildDirtyPatch(original, current, changedFieldNames) {
  const patch = {};
  for (const name of changedFieldNames) {
    const next = getNestedValue(current, name);
    const prev = getNestedValue(original, name);
    if (!valuesEqual(next, prev)) {
      setNestedValue(patch, name, unwrapValue(next));
    }
  }
  return patch;
}

export function stripMetaFields(data) {
  if (!data || typeof data !== "object") return data;
  const { _id, createdAt, updatedAt, __v, createdBy, ...rest } = data;
  return rest;
}
