// src/utils/mongoFilterCompiler.js

export function buildMongoFilter(node) {
  if (!node) return {};

  // leaf case
  if (!node.operation && node.field && node.operator) {
    return {
      [node.field]: { [node.operator]: node.value }
    };
  }

  // group case
  if (node.operation && Array.isArray(node.filters)) {
    const mongoOp = node.operation; // already $and or $or
    const compiledFilters = [];

    for (const child of node.filters) {
      const compiled = buildMongoFilter(child);
      if (compiled && Object.keys(compiled).length > 0) {
        compiledFilters.push(compiled);
      }
    }

    // If no valid children → skip (lenient)
    if (!compiledFilters.length) return {};

    return { [mongoOp]: compiledFilters };
  }

  return {}; // lenient fallback
}
