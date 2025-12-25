import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import AuthRouter from "./routes/authRoutes.js";
import populateHelper from "./routes/populateRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import { apiHitLogger } from "./middlewares/apiHitLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import connectDB from "./Config/ConnectDB.js";
import cookieParser from "cookie-parser";
import databaseIndexer from "./services/databaseIndexer.js";
import cacheService from "./services/cacheService.js";
import asyncNotificationService from "./services/asyncNotificationService.js";
import computationService from "./services/computationService.js";
import { smartCacheMiddleware, asyncProcessingMiddleware, cacheInvalidationMiddleware, compressionMiddleware } from "./middlewares/performanceMiddleware.js";
import "./cron/AttendanceCron.js";

// Memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=4096'; // 4GB heap
process.env.UV_THREADPOOL_SIZE = 16; // Increase thread pool

dotenv.config();
connectDB();

// Initialize database indexes after connection
setTimeout(async () => {
  try {
    // Initialize cache first
    const { setCache } = await import('./utils/cache.js');
    await setCache();
    
    // Redis completely disabled - no connection attempt
    
  } catch (error) {
    // Silenced
  }
}, 5000); // Wait 5 seconds for DB connection

const app = express();
const server = http.createServer(app);

// Memory-efficient middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const allowedOrigins = [
  "https://lmx-tracker--p1hvjsjwqq.expo.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:19006",
  "http://10.116.40.208:5173",
  "http://10.11.244.208:5173",
  "https://your-app.vercel.app"
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-uuid']
}));

app.use(apiHitLogger);
app.use(compressionMiddleware);
app.use(asyncProcessingMiddleware);

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/populate", smartCacheMiddleware, cacheInvalidationMiddleware, populateHelper);
app.use("/api/files", fileRoutes);
app.use("/api", locationRoutes);
app.use("/api", bankRoutes);
app.use("/api", taskRoutes);

app.use(errorHandler);

// Optimized Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  },
  // Connection limits and timeouts
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000, // 60s ping timeout
  pingInterval: 25000, // 25s ping interval
  upgradeTimeout: 10000, // 10s upgrade timeout
  // Memory optimization
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Connection tracking for memory management
const activeConnections = new Map();
const userRooms = new Map();

io.on("connection", (socket) => {
  // Track connection
  activeConnections.set(socket.id, {
    userId: null,
    connectedAt: Date.now(),
    lastActivity: Date.now()
  });

  // Join user room with cleanup
  socket.on("join", (userId) => {
    if (!userId) return;
    
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.userId = userId;
      connection.lastActivity = Date.now();
    }
    
    // Leave previous rooms
    const previousRooms = userRooms.get(socket.id) || [];
    previousRooms.forEach(room => socket.leave(room));
    
    // Join new room
    socket.join(userId);
    userRooms.set(socket.id, [userId]);
  });

  // Update activity timestamp
  socket.on('activity', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  });

  // Cleanup on disconnect
  socket.on("disconnect", (reason) => {
    activeConnections.delete(socket.id);
    userRooms.delete(socket.id);
    
    // Log disconnection reason for monitoring
    if (reason === 'transport error' || reason === 'ping timeout') {
      console.warn(`Socket disconnected due to: ${reason}`);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    activeConnections.delete(socket.id);
    userRooms.delete(socket.id);
  });
});

// Memory cleanup intervals
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  // Clean stale connections
  for (const [socketId, connection] of activeConnections.entries()) {
    if (now - connection.lastActivity > staleThreshold) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      activeConnections.delete(socketId);
      userRooms.delete(socketId);
    }
  }
  
  // Log memory usage
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 1024 * 1024 * 1024) { // > 1GB
    console.warn('High memory usage:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      connections: activeConnections.size
    });
  }
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down...');
  
  // Close services
  await Promise.all([
    new Promise(resolve => io.close(resolve)),
    asyncNotificationService.shutdown(),
    computationService.shutdown()
  ]);
  
  console.log('All services closed');
  process.exit(0);
});

// Memory leak detection
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('Memory leak detected:', warning.message);
  }
});

export { app, server, io, activeConnections };
