import mongoose, { Schema } from "mongoose";

const sessionsSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },

  generatedToken: {
    token: { type: String },
    secret : {type:String},
    expiry: { type: String, default: "1h" }
  },

  refreshToken: {
    token: { type: String },
    secret : {type:String},
    expiry: { type: String, default: "7d" }
  },

  platform: { type: String, enum: ["web", "mobile"] },

  status: { type: String, enum: ["Active", "DeActive"], default: "Active" }
}, { timestamps: true });

const Session =
  mongoose.models.sessions || mongoose.model("sessions", sessionsSchema);

export default Session;
