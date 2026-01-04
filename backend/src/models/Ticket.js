import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  title: { type: String, required: true, maxlength: 200 },
  userStory: { type: String, required: true }, // This will be visible to external clients
  description: { type: String }, // Internal description
  product: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Bug', 'Feature', 'Enhancement', 'Support'], 
    default: 'Bug' 
  },
  impactAnalysis: { type: String },
  url: { type: String },
  acceptanceCriteria: { type: String },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  taskTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskType' },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Review', 'Testing', 'Completed', 'Closed'], 
    default: 'Open' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel', required: true },
  createdByModel: { type: String, enum: ['Employee', 'agents'], required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }], // Multiple assignees
  accountManager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    get: function() {
      return this.clientId?.accountManager || this.assignedTo?.[0];
    }
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  
  // Task synchronization fields
  linkedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  isConvertedToTask: { type: Boolean, default: false },
  convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  convertedAt: { type: Date },
  
  // Milestone fields
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'milestones', required: true, index: true },
  milestoneStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
    default: 'Pending',
    index: true
  },
  
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  dueDate: { type: Date },
  startDate: { type: Date, default: Date.now },
  liveHours: { type: Number, default: 0 },
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
ticketSchema.index({ projectTypeId: 1 });
ticketSchema.index({ clientId: 1 });
ticketSchema.index({ taskTypeId: 1 });
ticketSchema.index({ category: 1, priority: 1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ linkedTaskId: 1 });
ticketSchema.index({ accountManager: 1 });
ticketSchema.index({ milestoneId: 1, milestoneStatus: 1 });

export default mongoose.model('Ticket', ticketSchema);