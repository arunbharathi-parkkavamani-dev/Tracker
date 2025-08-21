// models/DailyActivity.js
const mongoose = require('mongoose');

const DailyActivitySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  date: { type: Date, default: Date.now },
  activity: { type: String, trim: true }, // description of activity
  taskType: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskType' }, // optional link
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }       // optional link
}, { timestamps: true });

module.exports = mongoose.model('DailyActivity', DailyActivitySchema);