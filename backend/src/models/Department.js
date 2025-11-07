// models/Department.js
import { Schema, model } from 'mongoose';

const DepartmentSchema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true
  },
  shortCode: { 
    type: String,
    trim: true,
    unique: true
  },
  description: { type: String },
  leavePolicy : { type: Schema.Types.ObjectId, ref: 'LeavePolicy'},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DepartmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Department', DepartmentSchema);