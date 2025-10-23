import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

// Disable strict populate to allow flexible population of refs
mongoose.set("strictPopulate", false);

const connectDB = async (retries = 5) => {
  if (!process.env.MONGO_URI) {
    console.error('❎MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅MongoDB connected successfully');
      break;
    } catch (err) {
      console.error(`❎MongoDB connection failed. Retries left: ${retries - 1}`, err);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000)); // wait 5s before retry
    }
  }

  if (!retries) process.exit(1);
};

export default connectDB;
