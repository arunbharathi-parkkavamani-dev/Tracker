// src/models/AccessPolicies.js
import mongoose from "mongoose";

const AccessPolicySchema = new mongoose.Schema({
  role: { type: String, required: true, lowercase: true },

  modelName: { type: String, required: true }, // e.g. "Employee", "Attendance"

  permissions: {
    read: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },

  forbiddenAccess: {
    read: { type: [String], default: [] },
    create: { type: [String], default: [] },
    update: { type: [String], default: [] },
    delete: { type: [String], default: [] }
  },

  allowAccess: {
    read: { type: [String], default: [] },
    create: { type: [String], default: [] },
    update: { type: [String], default: [] },
    delete: { type: [String], default: [] }
  },

  registry: { type: [String], default: [] },

  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, { timestamps: true });

// Ensure uniqueness of (role, modelName) pair
AccessPolicySchema.index({ role: 1, modelName: 1 }, { unique: true });

export default mongoose.model("AccessPolicies", AccessPolicySchema);
