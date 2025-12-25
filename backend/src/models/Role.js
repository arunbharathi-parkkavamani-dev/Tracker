// models/Role.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capabilities: [{
    type: String, 
    required: true
  }],
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 1,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  description: { type: String }
}, { timestamps: true });

// Compound index for active roles
roleSchema.index({ isActive: 1, level: 1 });
roleSchema.index({ isActive: 1, name: 1 });

export default mongoose.model("roles", roleSchema);