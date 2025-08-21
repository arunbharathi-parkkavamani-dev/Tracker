// models/Attendance.js
import { Schema, model } from 'mongoose';

const AttendanceSchema = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Half Day', 'Work From Home'],
    default: 'Present'
  },
  leaveType: { // optional, only used when status === 'Leave'
    type: Schema.Types.ObjectId,
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

export default model('Attendance', AttendanceSchema);