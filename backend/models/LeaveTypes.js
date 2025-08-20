// models/LeaveType.js
const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: true
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LeaveTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LeaveType', LeaveTypeSchema);