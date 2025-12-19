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



// FCM Token Registration
router.post("/store-push-token", authMiddleware, storePushToken);

export default router;
