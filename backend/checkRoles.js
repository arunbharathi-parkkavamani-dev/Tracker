import mongoose from "mongoose";
import dns from "dns";

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

async function run() {
  await mongoose.connect("mongodb+srv://root:root123@tracker.vnkyhhp.mongodb.net/tracker");
  const roles = await mongoose.connection.db.collection("roles").find({}).toArray();
  console.log(JSON.stringify(roles.map(r => ({name: r.name, level: r.level})), null, 2));
  process.exit(0);
}
run();
