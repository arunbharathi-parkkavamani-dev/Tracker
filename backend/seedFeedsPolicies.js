import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

// Force Node.js to use reliable public DNS for MongoDB SRV lookups
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, "src/Config/.env") });

// Import models
import models from "./src/models/Collection.js";

async function seedFeedsPolicies() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/tracker";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding feeds policies");

    // 1. Find the Developer role
    const developerRole = await models.roles.findOne({ name: { $regex: /developer/i } });

    if (!developerRole) {
      console.error("Developer role not found. Cannot proceed.");
      process.exit(1);
    }

    console.log(`Found Developer role with ID: ${developerRole._id}`);

    const modelsToAllow = ["feedposts", "feedcomments", "feedgroups", "feedchannels"];

    // 2. Insert or update policies
    for (const modelName of modelsToAllow) {
      await models.accesspolicies.findOneAndUpdate(
        { role: developerRole._id, modelName: modelName },
        {
          role: developerRole._id,
          modelName: modelName,
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true
          }
        },
        { upsert: true, new: true }
      );
      console.log(`Granted full access for Developer role to model: ${modelName}`);
    }

    console.log("Seeding feeds policies completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding feeds policies:", error);
    process.exit(1);
  }
}

seedFeedsPolicies();
