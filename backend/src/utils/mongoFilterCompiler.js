// src/utils/mongoFilterCompiler.js
import mongoose from "mongoose";

export function buildMongoFilter(node) {
  if (!node) return {};

  // leaf case
  if (!node.operation && node.field && node.operator) {
    let value = node.value;
    
    // Handle ObjectId fields - prevent empty string casting
    if (node.field === '_id' || node.field.endsWith('._id') || node.field.endsWith('Id')) {
      if (value === '' || value === null || value === undefined) {
        return {}; // Skip empty ObjectId values
      }
      if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        value = new mongoose.Types.ObjectId(value);
      }
    }
    
    return {
      [node.field]: { [node.operator]: value }
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
