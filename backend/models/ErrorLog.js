// models/ErrorLog.js
const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  message: { type: String },
  stack: { type: String },
  route: { type: String }, // API route or function name
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // who triggered
  level: { type: String, enum: ['Info', 'Warning', 'Error', 'Critical'], default: 'Error' }
}, { timestamps: true });

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);