// models/Attendance.js
import { Schema, model } from "mongoose";

const AttendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: [
      "Present", "Absent", "Leave", "Half Day", "Work From Home",
      "Early check-out", "Check-Out", "Unchecked", "LOP",
      "Holiday", "Week Off", "Pending", "Late Entry"
    ],
    default: "Present",
    index: true
  },
  leaveType: { type: Schema.Types.ObjectId, ref: "leavetypes" },
  checkIn: { type: Date },
  checkOut: { type: Date },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  request: { type: String },
  managerId: { type: Schema.Types.ObjectId, ref: "employees", index: true },
  employeeName: { type: String },
  workHours: { type: Number, min: 0, max: 24 } // Calculated field
}, { timestamps: true });

// Compound indexes for performance
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ employee: 1, status: 1, date: -1 });
AttendanceSchema.index({ managerId: 1, status: 1, date: -1 });
AttendanceSchema.index({ date: -1, status: 1 }); // Recent attendance by status
AttendanceSchema.index({ status: 1, date: -1 }); // Status-based queries

// Calculate work hours before saving
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.workHours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
  }
  next();
});

export default model("attendances", AttendanceSchema);
