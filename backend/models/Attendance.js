// models/Attendance.js
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: { type: Date, required: true },
  status: {
    type: Boolean,
    default: 'True'
  },
  LeaveType : { 
    mongoose.Schema.Types.ObjectId, 
    ref: 'LeaveType'
  },
  checkIn: { type: Date },
  checkOut: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AttendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);