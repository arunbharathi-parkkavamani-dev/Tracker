import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import AuthRouter from "./routes/authRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import agentInviteRoutes from "./routes/agentInviteRoutes.js";
import populateHelper from "./routes/populateRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import adminSystemRoutes from "./routes/adminSystemRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";

import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import { authMiddleware } from "./Controller/AuthController.js";
import { agentAuthMiddleware } from "./middlewares/agentAuthMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestTracer } from "./middlewares/requestTracer.js";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware.js";
import { raceConditionMiddleware } from "./services/raceConditionHandler.js";
import { runSecurityTests } from "./utils/securityIntegrationTest.js";
import connectDB from "./Config/ConnectDB.js";
import cookieParser from "cookie-parser";
import databaseIndexer from "./services/databaseIndexer.js";

import "./cron/AttendanceCron.js";
import "./cron/LeaveAccrualCron.js";
import "./cron/EscalationCron.js";

// Memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=4096'; // 4GB heap
process.env.UV_THREADPOOL_SIZE = 16; // Increase thread pool

dotenv.config();

// ─── App & Server ────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const allowedOrigins = [
  "https://lmx-tracker--p1hvjsjwqq.expo.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:54979",
  "http://127.0.0.1:5173",
];

const lanRegex = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || lanRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-uuid', 'x-source']
}));

app.use(agentAuthMiddleware);
app.use(requestTracer);
app.use(apiHitLogger);
app.use(rateLimitMiddleware({ enabled: true }));
app.use(raceConditionMiddleware({ enabled: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

app.use("/api/agent", agentRoutes);
app.use("/api/agent-invite", agentInviteRoutes);
app.use("/api/auth", AuthRouter);
app.use("/api/populate", populateHelper);
app.use("/api/files", authMiddleware, fileRoutes);
app.use("/api", locationRoutes);
app.use("/api", bankRoutes);
app.use("/api/config", configRoutes);
app.use("/api/admin", adminSystemRoutes);
app.use("/api/export", exportRoutes);

app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const activeConnections = new Map();
const userRooms = new Map();

io.on("connection", (socket) => {
  activeConnections.set(socket.id, {
    userId: null,
    connectedAt: Date.now(),
    lastActivity: Date.now()
  });

  socket.on("join", (userId) => {
    if (!userId) return;
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.userId = userId;
      connection.lastActivity = Date.now();
    }
    const previousRooms = userRooms.get(socket.id) || [];
    previousRooms.forEach(room => socket.leave(room));
    socket.join(userId);
    userRooms.set(socket.id, [userId]);
  });

  socket.on("ticket_typing", async ({ ticketId, isTyping }) => {
    try {
      const connection = activeConnections.get(socket.id);
      if (!connection?.userId) return;
      const { default: models } = await import("./models/Collection.js");
      const participants = await models.ticket_participants.find({ ticketId }).lean();
      if (!participants) return;
      participants.forEach(p => {
        if (p.userId.toString() === connection.userId.toString()) return;
        io.to(p.userId.toString()).emit("ticket_typing", {
          ticketId,
          userId: connection.userId,
          isTyping
        });
      });
    } catch (e) {
      console.error("Error in ticket_typing socket:", e);
    }
  });

  socket.on('activity', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) connection.lastActivity = Date.now();
  });

  socket.on("disconnect", (reason) => {
    activeConnections.delete(socket.id);
    userRooms.delete(socket.id);
    if (reason === 'transport error' || reason === 'ping timeout') {
      console.warn(`Socket disconnected due to: ${reason}`);
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    activeConnections.delete(socket.id);
    userRooms.delete(socket.id);
  });
});

// Stale connection cleanup
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000;
  for (const [socketId, connection] of activeConnections.entries()) {
    if (now - connection.lastActivity > staleThreshold) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.disconnect(true);
      activeConnections.delete(socketId);
      userRooms.delete(socketId);
    }
  }
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 1024 * 1024 * 1024) {
    console.warn('High memory usage:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      connections: activeConnections.size
    });
  }
}, 60000);

// Memory leak detection
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('Memory leak detected:', warning.message);
  }
});

// ─── initApp: called by server.js BEFORE listen() ────────────────────────────
export async function initApp() {
  // 1. Connect to MongoDB — everything else depends on this
  await connectDB();

  // 2. Initialize cache now that DB is confirmed ready
  try {
    const { setCache } = await import('./utils/cache.js');
    await setCache();
  } catch (error) {
    // Silenced — cache failure is non-fatal
  }

  // 3. Security self-check — non-blocking, won't crash server on failure
  runSecurityTests().catch((error) => {
    console.error("⛔ CRITICAL WARNING: Security self-check failed. Proceeding with caution...");
    console.error(error);
  });
}

export { app, server, io, activeConnections };