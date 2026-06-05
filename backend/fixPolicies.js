import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
dotenv.config({ path: path.resolve(__dirname, 'src/Config/.env') });

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const AccessPoliciesSchema = new mongoose.Schema({}, { strict: false });
const AccessPolicies = mongoose.model("accesspolicies", AccessPoliciesSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
  });

  console.log("Connected to MongoDB");

  const modelsToFix = ['feedchannels', 'feedgroups', 'feedposts', 'feedcomments'];

  for (const model of modelsToFix) {
    const result = await AccessPolicies.updateMany(
      { modelName: model },
      { 
        $set: { 
          "allowAccess.create": ["*"], 
          "allowAccess.read": ["*"], 
          "allowAccess.update": ["*"],
          "allowAccess.delete": ["*"]
        } 
      }
    );
    console.log(`Updated ${result.modifiedCount} policies for ${model}`);
  }

  await mongoose.disconnect();
  console.log("Done. Please RESTART the backend server to clear the policy cache.");
}

run().catch(console.error);
