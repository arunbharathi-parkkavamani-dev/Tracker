import mongoose from "mongoose"
import dotenv from "dotenv";

dotenv.config({ path: './src/config/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
export default connectDB;