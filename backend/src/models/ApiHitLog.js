// models/ApiHitLog.js
import { Schema, model } from 'mongoose';

const ApiHitLogSchema = new Schema({
  endpoint: { type: String },              // API route
  method: { type: String },                // GET, POST, PUT, DELETE
  statusCode: { type: Number },            // HTTP status
  responseTime: { type: Number },          // ms
  user: { type: Schema.Types.ObjectId, ref: 'Employee' }, // optional
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

export default model('apihitLog', ApiHitLogSchema);