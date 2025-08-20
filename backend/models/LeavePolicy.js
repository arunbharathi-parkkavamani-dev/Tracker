// models/LeavePolicy.js
const mongoose = require('mongoose');

const LeavePolicySchema = new mongoose.Schema({
  designation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation',
    required: true
  },
  leaves: [
    {
      leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' },
      maxDays: { type: Number, default: 0 } // override default maxDays if needed
    },
      carry forward: { type: Boolean, default: false}
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LeavePolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LeavePolicy', LeavePolicySchema);