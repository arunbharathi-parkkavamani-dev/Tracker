import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    projectTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectType", required:true },
    taskTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskType", required:true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],

    title: { type: String, trim: true, required: true},
    referenceUrl: { type: String },
    userStory: { type: String },
    observation: { type: String },
    impacts: { type: String },
    acceptanceCreteria: { type: String },

    attachments: [{ type: String, default: null }],

    commentsThread: { type: mongoose.Schema.Types.ObjectId, ref: "CommentsThread" },

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

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: [] }],
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
export default Task;
