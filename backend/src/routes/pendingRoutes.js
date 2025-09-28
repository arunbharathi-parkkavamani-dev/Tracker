import express from "express";
import { getPendingRequests } from "../Controller/attandanceController.js";

const router = express.Router();

// Fetch pending attendance requests (POST)
router.post("/pending", getPendingRequests);

export default router;
