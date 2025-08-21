// models/LeaveType.js
import { Schema, model } from 'mongoose';

const LeaveTypeSchema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {timestamps:true});

export default model('LeaveType', LeaveTypeSchema);