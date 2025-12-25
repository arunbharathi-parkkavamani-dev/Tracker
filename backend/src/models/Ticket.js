import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['IT Support', 'HR Query', 'Facility', 'Finance', 'Development', 'General'], 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
    default: 'Open' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  
  // Task synchronization fields
  linkedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  isConvertedToTask: { type: Boolean, default: false },
  convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  convertedAt: { type: Date },
  
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    comment: String,
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    commentedAt: { type: Date, default: Date.now }
  }],
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  resolution: { type: String }
}, {
  timestamps: true
});

// Auto-generate ticket ID
ticketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const count = await this.constructor.countDocuments();
    this.ticketId = `TKT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ category: 1, priority: 1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ linkedTaskId: 1 });
ticketSchema.index({ isConvertedToTask: 1 });

export default mongoose.model('Ticket', ticketSchema);