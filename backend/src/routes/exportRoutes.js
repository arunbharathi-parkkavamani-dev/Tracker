import express from "express";
import { generateTaskCSV } from "../services/exportService.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/export/tasks
 * @desc    Export tasks to CSV
 * @access  Private
 */
router.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const { status, priority, client } = req.query;
    
    // Build filter based on query params
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priorityLevel = priority;
    if (client) filter.clientId = client; // would need to be converted to ObjectId if it's stored as ObjectId

    const csvData = await generateTaskCSV(filter);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"tasks_export.csv\"");
    
    return res.status(200).send(csvData);
  } catch (error) {
    console.error("Export Tasks Error:", error);
    res.status(500).json({ success: false, message: "Failed to export tasks" });
  }
});

export default router;
