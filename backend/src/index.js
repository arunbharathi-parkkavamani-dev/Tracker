import express from "express";
import http from "http"; // for creating server
import connectDB from "./Config/ConnectDB.js";
import cors from "cors";
import dotenv from "dotenv";
import populate from "./routes/populateRoutes.js";
import auth from "./routes/authRoutes.js";
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import "./cron/AttendanceCron.js";
import { getPendingRequests } from "./Controller/attandanceController.js";
import { Server } from "./socket.io";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // wrap Express app in HTTP server

// ---------------- MIDDLEWARE ----------------
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(apiHitLogger);

// ---------------- ROUTES ----------------
app.use("/api/auth", auth);
app.use("/api/populate", populate);
app.use("/api/attendance", getPendingRequests); // consider making this a router
app.use(errorHandler);

// ---------------- SOCKET.IO ----------------
const io = new Server(server, {
  cors: {
    origin: true, // or specific frontend URL
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room for user-specific notifications
  socket.on("join", (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Export io so controllers can emit notifications
export { io };

// ---------------- START SERVER ----------------
export default app;
// Now the server is created using http and socket.io is integrated
// You can run the server using: node backend/src/index.js
// Make sure to handle socket connections in your controllers as needed