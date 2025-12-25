import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: {
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  workingDays: { type: Number, required: true },
  presentDays: { type: Number, required: true },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  grossSalary: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Processed', 'Paid'], default: 'Draft' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  processedAt: { type: Date },
  paidAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1, createdAt: -1 });
payrollSchema.index({ processedAt: -1 });

export default mongoose.model('Payroll', payrollSchema);