import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "client", required: true },
    projectTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "projecttype", required:true },
    taskTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "tasktype", required:true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "employee" }],

    title: { type: String, trim: true, required: true},
    referenceUrl: { type: String },
    userStory: { type: String },
    observation: { type: String },
    impacts: { type: String },
    acceptanceCreteria: { type: String },

    attachments: [{ type: String, default: null }],

    commentsThread: { type: mongoose.Schema.Types.ObjectId, ref: "commentsthread" },

    startDate: { type: Date },
    endDate: { type: Date },

    priorityLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Weekly Priority"],
      default : "Low"
    },

    tags: [{ type: String }],

    status: {
      type: String,
      enum: [
        "Backlogs",
        "To Do",
        "In Progress",
        "In Review",
        "Approved",
        "Rejected",
        "Completed",
        "Deleted",
      ],
      default: "Backlogs",
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "employee", default: [] }],
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
export default Task;
