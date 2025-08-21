import express from "express";
import connectDB from "./Config/ConnectDB.js";
import cors from "cors";
import dotenv from "dotenv";
import populate from "./routes/populateRoutes.js";
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import {errorHandler} from "./middlewares/errorHandler.js";

connectDB();

const app = express();
dotenv.config();

app.use(cors({
    origin:'localhost:5173',
    credentials:true,
}))
app.use(express.json());

app.use(apiHitLogger)

app.use("/api/populate", populate);
app.use(errorHandler)

export default app;
