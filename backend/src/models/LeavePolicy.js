// models/LeavePolicy.js
import { Schema, model } from 'mongoose';

const LeavePolicySchema = new Schema({
  leaves: [
    {
      leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType' },
      maxDaysPerMonth: { type: Number, default: 0 }, // override default maxDays if needed
      maxDaysPerYear: { type: Number, default:0},
      carryForward: { type: Boolean, default: false}
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LeavePolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('LeavePolicy', LeavePolicySchema);