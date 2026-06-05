import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId:         { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true, index: true },
  month:              { type: Number, required: true, min: 1, max: 12 },
  year:               { type: Number, required: true },
  salaryStructureId:  { type: mongoose.Schema.Types.ObjectId, ref: 'salarystructures' },
  payrollRunId:       { type: mongoose.Schema.Types.ObjectId, ref: 'payrollruns', index: true },

  // Day accounting
  workingDays:        { type: Number, required: true },
  presentDays:        { type: Number, required: true },
  lopDays:            { type: Number, default: 0 },
  leaveDays:          { type: Number, default: 0 },
  overtimeHours:      { type: Number, default: 0 },
  overtimePay:        { type: Number, default: 0 },

  // Computed breakdown snapshots — immutable after Approved
  earnedBreakdown:    { type: Map, of: Number, default: {} },
  deductionBreakdown: { type: Map, of: Number, default: {} },

  grossSalary:        { type: Number, required: true },
  netSalary:          { type: Number, required: true },

  status:             { type: String, enum: ['Draft', 'Processing', 'Processed', 'Approved', 'Paid'], default: 'Draft', index: true },

  processedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'employees' },
  processedAt:        { type: Date },
  approvedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'employees' },
  approvedAt:         { type: Date },
  frozenAt:           { type: Date },
  paidAt:             { type: Date },

  // Phase 2 placeholder — PDF payslip
  payslipUrl:         { type: String, default: null },
  generatedAt:        { type: Date, default: null },

  remarks:            { type: String }
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1, createdAt: -1 });
payrollSchema.index({ status: 1, month: 1, year: 1 });
payrollSchema.index({ payrollRunId: 1 });
payrollSchema.index({ processedAt: -1 });

export default mongoose.model('payrolls', payrollSchema);
