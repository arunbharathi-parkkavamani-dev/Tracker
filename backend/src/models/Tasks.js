import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "clients", required: true },
    projectTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "projecttypes", required:true },
    taskTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "tasktypes", required:true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees" }],

    title: { type: String, trim: true, required: true},
    referenceUrl: { type: String },
    userStory: { type: String },
    observation: { type: String },
    impacts: { type: String },
    acceptanceCreteria: { type: String },

    attachments: [{ type: String, default: null }],

    commentsThread: { type: mongoose.Schema.Types.ObjectId, ref: "commentsthreads" },

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

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees", default: [] }],
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model("tasks", TaskSchema);
export default Task;
