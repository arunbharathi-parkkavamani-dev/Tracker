// models/DailyActivity.js
import { Schema, model } from "mongoose";

const DailyActivitySchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "clients" }, // optional link
    projectType: { type: Schema.Types.ObjectId, ref: "projecttypes" }, // optional link
    user: { type: Schema.Types.ObjectId, ref: "employees" },
    date: { type: Date, default: Date.now },
    taskType: { type: Schema.Types.ObjectId, ref: "tasktypes" }, // optional link
    activity: { type: String, trim: true }, // description of activity
    assignedTo: { type: Schema.Types.ObjectId, ref: "employees"}, // optional link
    status: { type: String, enum: ["Pending", "Completed", "In Progress"], default: "Pending" }, // optional link
  },
  { timestamps: true }
);

// Indexes for optimal filtering
DailyActivitySchema.index({ user: 1, date: 1 });
DailyActivitySchema.index({ assignedTo: 1, status: 1 });
DailyActivitySchema.index({ client: 1, date: 1 });
DailyActivitySchema.index({ user: 1, status: 1 });
DailyActivitySchema.index({ date: 1, status: 1 });

export default model("dailyactivities", DailyActivitySchema);
