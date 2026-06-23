import mongoose from 'mongoose';

const TimeTrackerSessionSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'tasks', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projecttypes', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true, index: true },
  
  startTime: { type: Date, required: true, default: Date.now, index: true },
  endTime: { type: Date },
  
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active',
    index: true
  },
  
  // Total duration in seconds for this session
  duration: { type: Number, default: 0 },
  
  // For multiple pauses within a single high-level session
  pauses: [{
    pausedAt: { type: Date, required: true },
    resumedAt: { type: Date },
    duration: { type: Number, default: 0 } // duration of the pause
  }],
  
  notes: { type: String, trim: true }
}, { timestamps: true });

// Compound indexes
TimeTrackerSessionSchema.index({ taskId: 1, userId: 1, status: 1 });
TimeTrackerSessionSchema.index({ userId: 1, status: 1 });

// Ensure a user only has one active session globally
TimeTrackerSessionSchema.index({ userId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'active' } 
});

export default mongoose.models.TimeTrackerSession || mongoose.model('TimeTrackerSession', TimeTrackerSessionSchema);
