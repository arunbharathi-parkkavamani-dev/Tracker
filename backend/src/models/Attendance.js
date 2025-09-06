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
    enum: ['Present', 'Absent', 'Leave', 'Half Day', 'Work From Home','Early check-out','Check-Out', 'Unchecked', 'LOP', 'Holiday', 'Week Off'],
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
},{ timestamps: true});

// ✅ Ensure only one record per employee per date
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
export default model('Attendance', AttendanceSchema);