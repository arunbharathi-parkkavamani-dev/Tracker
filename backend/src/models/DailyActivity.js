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
  },
  { timestamps: true }
);

export default model("DailyActivity", DailyActivitySchema);
