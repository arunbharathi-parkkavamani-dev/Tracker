import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import AuthRouter from "./routes/authRoutes.js";
import notificationRoutes from "./routes/pendingRoutes.js";
import populateHelper from "./routes/populateRoutes.js";
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import connectDB from "./Config/ConnectDB.js";
import cookieParser from "cookie-parser";
import "./cron/AttendanceCron.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (mobile apps)
      if (!origin) return callback(null, true);
      // Allow specific web origins
      const allowedOrigins = [
        "https://lmx-tracker--kqx1p6ip7h.expo.app", // Expo Web build
        "http://localhost:3000",
        "http://localhost:19006",
        "http://localhost:8081"
      ];
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use(apiHitLogger); // Middleware to log API hits

// Define routes
app.use("/api/auth", AuthRouter);
app.use("/api/populate", populateHelper);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

export { app, server, io };
