// routes/authRoutes.js
import express from "express";
import {
    login, logout, refresh, authMiddleware, storePushToken, sendManualTestNotification
} from "../Controller/AuthController.js"

const router = express.Router();

// ------------------- AUTH ROUTES -------------------

// Login
router.post("/login", login);

// Refresh access token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);



// FCM Token Registration
router.post("/store-push-token", authMiddleware, storePushToken);

// Manual Test Notification
router.post("/test-notification", authMiddleware, sendManualTestNotification);

export default router;
