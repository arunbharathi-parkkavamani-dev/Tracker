// server.js
import dotenv from "dotenv";
import { server } from "./src/index.js"; // ✅ use HTTP server, not app
import os from "os";
import https from "https";

dotenv.config();
const PORT = process.env.PORT || 3000;

// --- Helper: get local IP ---
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
};

// --- Helper: get public IP ---
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

// --- Start server ---
server.listen(PORT, "0.0.0.0", async () => {
  const localIP = getLocalIP();
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Local Access:  http://localhost:${PORT}`);
  if (localIP) console.log(`💻 LAN Access:    http://${localIP}:${PORT}`);

  try {
    const publicIP = await getPublicIP();
    console.log(`🌍 Public Access: http://${publicIP}:${PORT}`);
  } catch (err) {
    console.log("⚠️ Could not fetch public IP:", err.message);
  }
});
