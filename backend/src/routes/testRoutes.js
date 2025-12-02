import express from "express";
import { runSecurityTests } from "../utils/securityIntegrationTest.js";

const router = express.Router();

// Security test endpoint
router.get("/security", async (req, res) => {
  try {
    console.log("Running security tests...");
    await runSecurityTests();
    res.json({ 
      success: true, 
      message: "Security tests completed. Check server console for results." 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Security tests failed", 
      error: error.message 
    });
  }
});

export default router;