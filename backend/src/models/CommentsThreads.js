import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema(
  {
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

const CommentSchema = new mongoose.Schema(
  {
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "employees" }],
    replies: [ReplySchema], // array of reply objects
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

const CommentsThreadSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "tasks", required: true },
    comments: [CommentSchema], // array of comment objects
  },
  { timestamps: true }
);

const CommentsThread =
  mongoose.models.CommentsThread ||
  mongoose.model("commentsthreads", CommentsThreadSchema);

export default CommentsThread;
