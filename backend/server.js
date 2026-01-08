import dotenv from "dotenv";
import { server, app } from "./src/index.js";
import os from "os";
import https from "https";
import memoryMonitor from "./src/utils/memoryMonitor.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// Add basic request logging at server level
app.use((req, res, next) => {
  // console.log('=== SERVER LEVEL REQUEST ===');
  // console.log('Time:', new Date().toISOString());
  // console.log('Method:', req.method);
  // console.log('URL:', req.url);
  // console.log('IP:', req.ip);
  // console.log('Headers:', JSON.stringify(req.headers, null, 2));
  // console.log('============================');
  next();
});

// Test endpoint to verify server is working
app.get('/test', (req, res) => {
  // console.log('TEST ENDPOINT HIT');
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Memory optimization flags
process.env.NODE_OPTIONS = '--max-old-space-size=4096 --expose-gc';

// Helper: get local IP
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
};

// Helper: get public IP
const getPublicIP = () =>
  new Promise((resolve, reject) => {
    https
      .get("https://api.ipify.org?format=json", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data).ip));
      })
      .on("error", reject);
  });

// Start server with memory monitoring
server.listen(PORT, "0.0.0.0", async () => {
  // console.log('=== SERVER STARTING ===');
  const localIP = getLocalIP();
  // console.log(`✅ Server running on port ${PORT}`);
  // console.log(`📡 Local Access:  http://localhost:${PORT}`);
  if (localIP) // console.log(`💻 LAN Access:    http://${localIP}:${PORT}`);

    try {
      const publicIP = await getPublicIP();
      // console.log(`🌍 Public Access: http://${publicIP}:${PORT}`);
    } catch (err) {
      // console.log("⚠️ Could not fetch public IP:", err.message);
    }

  // Start memory monitoring
  memoryMonitor.startMonitoring(30000); // Every 30 seconds
  // console.log('🔍 Memory monitoring started');

  // Log initial memory stats
  const initialStats = memoryMonitor.getMemoryStats();
  // console.log('=== SERVER READY ===');
  // // console.log('📊 Initial memory:', initialStats);
});

// Graceful shutdown with cleanup
process.on('SIGTERM', () => {
  // console.log('🔄 Graceful shutdown initiated...');

  server.close(() => {
    // console.log('✅ Server closed');

    // Final memory cleanup
    if (global.gc) {
      global.gc();
      // console.log('🗑️ Final garbage collection completed');
    }

    process.exit(0);
  });
});

process.on('SIGINT', () => {
  // console.log('\n🔄 Received SIGINT, shutting down gracefully...');
  process.emit('SIGTERM');
});
