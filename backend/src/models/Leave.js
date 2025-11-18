import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  employeeName : {type : String},
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveTypes" },
  leaveName : {type: String},
  startDate: { type: Date },
  endDate: { type: Date },
  totalDays: { type: Number },
  reason: { type: String, maxLength: 500, minLength: 5, trim: true },
  status: { type: String, enum:['Pending', 'Approved', 'Rejected'] },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  managerComments: { type: String, maxLength: 500, minLength: 5, trim: true },
  approvedAt: { type: Date },
  rejectedAt : { type: Date},
  document: { type: String },
}, { timestamps: true });

// Prevent duplicate leave entries by employee on exact date range
LeaveSchema.index(
  { employeeId: 1, startDate: 1, endDate: 1 },
  { unique: true }
);

export default mongoose.models.Leave || mongoose.model("Leave", LeaveSchema);
