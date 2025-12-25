// models/LeavePolicy.js
import { Schema, model } from 'mongoose';

const LeavePolicySchema = new Schema({
  name: { type: String, trim: true, required: true, index: true },
  leaves: [{
    leaveType: { type: Schema.Types.ObjectId, ref: 'leavetypes', required: true },
    maxDaysPerMonth: { type: Number, default: 0, min: 0 },
    maxDaysPerYear: { type: Number, default: 0, min: 0 },
    carryForward: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true, index: true },
  applicableRoles: [{ type: Schema.Types.ObjectId, ref: 'roles' }],
  description: { type: String }
}, { timestamps: true });

// Compound indexes
LeavePolicySchema.index({ isActive: 1, name: 1 });
LeavePolicySchema.index({ applicableRoles: 1, isActive: 1 });

export default model('leavepolicies', LeavePolicySchema);