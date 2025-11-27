import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    model: { type: String, required: true },          // e.g., "employees"
    docId: { type: mongoose.Schema.Types.ObjectId },  // target document
    action: { type: String, enum: ["update", "delete"], required: true },

    // who performed the action
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String },

    // difference tracking
    before: { type: Object },   // previous values only (not whole doc)
    after: { type: Object },    // updated values (only changed fields)

    // pointer for multi-level approval logic later
    metadata: { type: Object }
  },
  { timestamps: true }
);

export default mongoose.model("auditlogs", AuditLogSchema);
