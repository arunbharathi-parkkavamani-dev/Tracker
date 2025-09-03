import express from "express";
import connectDB from "./Config/ConnectDB.js";
import cors from "cors";
import dotenv from "dotenv";
import populate from "./routes/populateRoutes.js";
import auth from "./routes/authRoutes.js"
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import {errorHandler} from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";

connectDB();

const app = express();
dotenv.config();

app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
}))
app.use(express.json());
app.use(cookieParser());

app.use(apiHitLogger)
app.use("/api/auth/", auth);
app.use("/api/populate", populate);
app.use(errorHandler)

export default app;
