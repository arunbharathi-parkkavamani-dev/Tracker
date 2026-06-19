// routes/authRoutes.js
import express from "express";
import {
  login, logout, refresh, authMiddleware, storePushToken, sendManualTestNotification,
  forgotPassword, resetPassword
} from "../Controller/AuthController.js"

const router = express.Router();

// ------------------- AUTH ROUTES -------------------

// Login
router.post("/login", (req, res, next) => {
  // console.log('=== LOGIN ROUTE REACHED ===');
  // console.log('Login Route - Method:', req.method);
  // console.log('Login Route - Body:', req.body);
  // console.log('Login Route - Headers:', req.headers);
  // console.log('============================');
  next();
}, login);

// Refresh access token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);



// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// FCM Token Registration
router.post("/store-push-token", authMiddleware, storePushToken);

// Manual Test Notification
router.post("/test-notification", authMiddleware, sendManualTestNotification);

export default router;
