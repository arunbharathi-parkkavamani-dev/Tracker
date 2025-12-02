// Standalone security test script
// Run with: node testSecurity.js

import dotenv from "dotenv";
import connectDB from "./src/Config/ConnectDB.js";
import { runSecurityTests } from "./src/utils/securityIntegrationTest.js";

dotenv.config();

async function main() {
  try {
    // Connect to database
    await connectDB();
    console.log("Database connected for testing\n");
    
    // Run security tests
    await runSecurityTests();
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main();