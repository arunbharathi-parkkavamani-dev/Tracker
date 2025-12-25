import mongoose from "mongoose";

const ExpenseItemSchema = new mongoose.Schema({
  expenseType: { 
    type: String, 
    enum: ["travel", "accommodation", "miscellaneous", "food"], 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  attachments: [{ 
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }]
});

const ExpenseSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "clients", required: true, index: true },
  
  date: { type: Date, required: true, index: true },
  
  expenses: [ExpenseItemSchema],
  
  dayTotal: { type: Number, required: true, min: 0 },
  totalExpenses: { type: Number, required: true, min: 0 },
  
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending",
    index: true
  },
  
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for performance
ExpenseSchema.index({ employeeId: 1, date: -1 });
ExpenseSchema.index({ clientId: 1, status: 1 });
ExpenseSchema.index({ status: 1, submittedAt: -1 });
ExpenseSchema.index({ employeeId: 1, clientId: 1, date: 1 }, { unique: true });

export default mongoose.model("expenses", ExpenseSchema);