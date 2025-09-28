import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import AuthRouter from "./routes/authRoutes.js";
import notificationRoutes from "./routes/pendingRoutes.js";
import populateRoutes from "./routes/populateRoutes.js";
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setCache } from "./utils/cache.js";

setCache();

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.use(apiHitLogger); // Middleware to log API hits

// Define routes
app.use("/api/auth", AuthRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/populate", populateRoutes);

// Error handling middleware
app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

export { app, server, io };
