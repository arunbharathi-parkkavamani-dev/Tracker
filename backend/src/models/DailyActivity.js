// models/DailyActivity.js
import { Schema, model } from 'mongoose';

const DailyActivitySchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
  date: { type: Date, default: Date.now },
  activity: { type: String, trim: true }, // description of activity
  taskType: { type: Schema.Types.ObjectId, ref: 'TaskType' }, // optional link
  client: { type: Schema.Types.ObjectId, ref: 'Client' }       // optional link
}, { timestamps: true });

export default model('DailyActivity', DailyActivitySchema);