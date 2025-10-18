// models/DailyActivity.js
import { Schema, model } from "mongoose";

const DailyActivitySchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "Client" }, // optional link
    projectType: { type: Schema.Types.ObjectId, ref: "ProjectType" }, // optional link
    user: { type: Schema.Types.ObjectId, ref: "Employee" },
    date: { type: Date, default: Date.now },
    taskType: { type: Schema.Types.ObjectId, ref: "TaskType" }, // optional link
    activity: { type: String, trim: true }, // description of activity
  },
  { timestamps: true }
);

export default model("DailyActivity", DailyActivitySchema);
