// routes/authRoutes.js
import express from "express";
import {
    login, logout, refresh, authMiddleware, storePushToken
} from "../Controller/AuthController.js"

const router = express.Router();

// ------------------- AUTH ROUTES -------------------

// Login
router.post("/login", login);

// Refresh access token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);

// Example of a protected route
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "User authenticated",
    user: req.user, // comes from decoded token
  });
});

// FCM Token Registration
router.post("/auth/store-push-token", authMiddleware, storePushToken);

export default router;
