// models/Tasks.js
import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "clients", required: true, index: true },
  projectTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "projecttypes", required: true, index: true },
  taskTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "tasktypes", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees", index: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees", index: true }],
  
  // Ticket synchronization fields
  linkedTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  isFromTicket: { type: Boolean, default: false },
  
  // Milestone fields (optional)
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: "milestones", index: true },
  milestoneStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "On Hold"],
    default: "Pending",
    index: true
  },
  
  title: { type: String, trim: true, required: true, index: 'text' },
  referenceUrl: { type: String },
  userStory: { type: String, index: 'text' },
  observation: { type: String },
  impacts: { type: String },
  acceptanceCreteria: { type: String },
  
  attachments: [{ type: String, default: null }],
  commentsThread: { type: mongoose.Schema.Types.ObjectId, ref: "commentsthreads" },
  
  startDate: { type: Date, index: true },
  endDate: { type: Date, index: true },
  
  priorityLevel: {
    type: String,
    enum: ["Low", "Medium", "High", "Weekly Priority"],
    default: "Low",
    index: true
  },
  
  tags: [{ type: String }],
  
  status: {
    type: String,
    enum: [
      "Backlogs", "To Do", "In Progress", "In Review",
      "Approved", "Rejected", "Completed", "Deleted"
    ],
    default: "Backlogs",
    index: true
  },
  
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees", default: [] }],
  estimatedHours: { type: Number, min: 0 },
  actualHours: { type: Number, min: 0 },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

// Text search index
TaskSchema.index({ title: 'text', userStory: 'text' });

// Compound indexes for performance optimization
TaskSchema.index({ clientId: 1, status: 1, createdAt: -1 }); // Client view filtering
TaskSchema.index({ assignedTo: 1, status: 1, priorityLevel: 1 }); // Employee task filtering
TaskSchema.index({ createdBy: 1, status: 1, createdAt: -1 }); // Creator filtering
TaskSchema.index({ status: 1, priorityLevel: 1, endDate: 1 }); // Status + priority + deadline
TaskSchema.index({ clientId: 1, projectTypeId: 1, status: 1 }); // Project filtering
TaskSchema.index({ assignedTo: 1, endDate: 1 }); // Deadline tracking
TaskSchema.index({ followers: 1, updatedAt: -1 }); // Follower notifications
TaskSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
TaskSchema.index({ linkedTicketId: 1 }); // Ticket synchronization
TaskSchema.index({ isFromTicket: 1 }); // Ticket-derived tasks
TaskSchema.index({ milestoneId: 1, milestoneStatus: 1 }); // Milestone tracking

export default mongoose.model("tasks", TaskSchema);
