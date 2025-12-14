import mongoose, { Schema } from "mongoose";

const sessionsSchema = new Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "employees",
      required: true 
    },

    // Access Token
    generatedToken: {
      token: { type: String },
      secret: { type: String },
      expiry: { type: String, default: "1h" }
    },

    // Refresh Token
    refreshToken: {
      token: { type: String },
      secret: { type: String },
      jti: { type: String },        // 🔥 Required for refresh rotation security
      expiry: { type: String, default: "7d" }
    },

    platform: { 
      type: String, 
      enum: ["web", "mobile"], 
      required: true 
    },

    // 🔥 Login approval support
    status: { 
      type: String, 
      enum: ["Active", "DeActive", "PendingApproval"],
      default: "Active" 
    },

    // 🔥 Push notification support
    fcmToken: {
      type: String,
      default: null
    },

    // 🔥 Device information (used for UI & security)
    deviceInfo: {
      name: { type: String },       // e.g., "Samsung S22", "Chrome Windows"
      os: { type: String },         // e.g., "Android 14", "Windows 11"
      userAgent: { type: String },  // browser info
      ipAddress: { type: String }
    },

    // 🔥 To show "Last active: 2 hours ago"
    lastUsedAt: { 
      type: Date, 
      default: Date.now 
    }

  },
  { timestamps: true }
);

const Session =
  mongoose.models.sessions || mongoose.model("sessions", sessionsSchema);

export default Session;
