// models/ApiHitLog.js
const mongoose = require('mongoose');

const ApiHitLogSchema = new mongoose.Schema({
  endpoint: { type: String },              // API route
  method: { type: String },                // GET, POST, PUT, DELETE
  statusCode: { type: Number },            // HTTP status
  responseTime: { type: Number },          // ms
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // optional
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ApiHitLog', ApiHitLogSchema);