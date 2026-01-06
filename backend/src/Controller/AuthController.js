import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import session from "../models/Session.js";
import { generateSecret, generateJti } from "../utils/tokenGenrator.js";
import { getDeviceInfo } from "../utils/deviceInfo.js";

/* -------------------------------- LOGIN -------------------------------- */

export const login = async (req, res, next) => {
  try {
    console.log("Login attempt:", req.body);
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);

    const { workEmail, password, platform = "web" } = req.body;
    const deviceUUID = req.headers['x-device-uuid'] || req.headers['deviceuuid'];

    if (!workEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!deviceUUID) {
      return res.status(400).json({ message: "Device UUID header is required" });
    }

    // 1. Validate user
    const employee = await Employee.findOne({
      "authInfo.workEmail": workEmail,
    });
    if (!employee)
      return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(
      password,
      employee.authInfo.password
    );
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    // 2. Build payload
    const payload = {
      id: employee._id,
      role: employee.professionalInfo.role,
      department: employee.professionalInfo.department,
      designation: employee.professionalInfo.designation,
      name: employee.basicInfo.firstName,
      managerId: employee.professionalInfo.reportingManager,
      platform,
    };

    // 3. Generate secrets + jti
    const accessSecret = generateSecret();
    const refreshSecret = generateSecret();
    const jti = generateJti();

    // 4. Create tokens
    const accessToken = jwt.sign(payload, accessSecret, {
      expiresIn: platform === "mobile" ? "30d" : "1h",
    });

    const refreshToken = jwt.sign(
      { id: payload.id, platform, jti },
      refreshSecret,
      { expiresIn: platform === "mobile" ? "90d" : "7d" }
    );

    // 5. Create session
    const userSession = await session.create({
      userId: payload.id,
      platform,
      deviceUUID,
      generatedToken: {
        token: accessToken,
        secret: accessSecret,
        expiry: "1h",
      },
      refreshToken: {
        token: refreshToken,
        secret: refreshSecret,
        jti,
        expiry: "7d",
      },
      deviceInfo: getDeviceInfo(req, platform),
      status: "Active",
    });

    // 6. Set cookies (web)
    if (platform === "web") {
      res.cookie("auth_token", accessToken, {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      sessionId: userSession._id,
      platform,
    });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------- AUTH MIDDLEWARE ----------------------------- */

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.auth_token ||
      req.headers.authorization?.split(" ")[1];
    const deviceUUID = req.headers['x-device-uuid'] || req.headers['X-Device-UUID'] || req.headers['deviceuuid'];
    const source = req.headers['x-source'];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Skip device UUID check for external sources
    if (!deviceUUID && source !== 'external') {
      return res.status(401).json({ message: "Device UUID required" });
    }

    // Decode to get userId
    const decoded = jwt.decode(token);
    if (!decoded?.id)
      return res.status(401).json({ message: "Invalid token" });

    // For external sources, skip session validation
    if (source === 'external') {
      req.user = decoded;
      return next();
    }

    const userSession = await session.findOne({
      userId: decoded.id,
      platform: decoded.platform,
      deviceUUID,
      status: "Active",
    });


    if (!userSession)
      return res.status(401).json({ message: "Session not found" });

    // Verify with stored secret
    jwt.verify(token, userSession.generatedToken.secret);

    userSession.lastUsedAt = new Date();
    await userSession.save();

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/* -------------------------------- REFRESH -------------------------------- */

export const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token || req.body.refreshToken;

    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    // Decode first (no verify)
    const decoded = jwt.decode(refreshToken);
    if (!decoded?.id || !decoded?.jti)
      return res.status(401).json({ message: "Invalid refresh token" });

    const deviceUUID = req.headers['x-device-uuid'] || req.headers['X-Device-UUID'];
    if (!deviceUUID) return res.status(401).json({ message: "Device UUID required" });

    const userSession = await session.findOne({
      userId: decoded.id,
      platform: decoded.platform,
      deviceUUID,
      status: "Active",
    });

    if (!userSession)
      return res.status(401).json({ message: "Session not found" });

    // Verify signature
    jwt.verify(refreshToken, userSession.refreshToken.secret);

    // jti check (REPLAY PROTECTION)
    if (decoded.jti !== userSession.refreshToken.jti) {
      userSession.status = "DeActive";
      await userSession.save();
      return res
        .status(403)
        .json({ message: "Refresh token reuse detected" });
    }

    // Rotate everything
    const newAccessSecret = generateSecret();
    const newRefreshSecret = generateSecret();
    const newJti = generateJti();

    const newAccessToken = jwt.sign(
      { id: decoded.id, platform: decoded.platform },
      newAccessSecret,
      { expiresIn: "1h" }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, platform: decoded.platform, jti: newJti },
      newRefreshSecret,
      { expiresIn: "7d" }
    );

    userSession.generatedToken = {
      token: newAccessToken,
      secret: newAccessSecret,
      expiry: "1h",
    };

    userSession.refreshToken = {
      token: newRefreshToken,
      secret: newRefreshSecret,
      jti: newJti,
      expiry: "7d",
    };

    userSession.lastUsedAt = new Date();
    await userSession.save();

    if (decoded.platform === "web") {
      res.cookie("auth_token", newAccessToken);
      res.cookie("refresh_token", newRefreshToken);
    }

    return res.json({
      message: "Token refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/* -------------------------------- LOGOUT -------------------------------- */

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
    const deviceUUID = req.headers['x-device-uuid'] || req.headers['X-Device-UUID'];


    if (!deviceUUID) return res.status(400).json({ message: "Device UUID required" });

    if (token) {
      const decoded = jwt.decode(token);

      if (decoded?.id) {
        const updateResult = await session.findOneAndUpdate(
          { userId: decoded.id, platform: decoded.platform, deviceUUID },
          { status: "DeActive" },
          { new: true }
        );

        if (!updateResult) {
          // Try without platform filter as fallback
          const fallbackResult = await session.findOneAndUpdate(
            { userId: decoded.id, deviceUUID },
            { status: "DeActive" },
            { new: true }
          );
        }
      }
    }

    res.clearCookie("auth_token");
    res.clearCookie("refresh_token");

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};



export const storePushToken = async (req, res, next) => {
  try {
    const { sessionId, fcmToken } = req.body;


    if (!sessionId || !fcmToken) {
      return res.status(400).json({ message: "Session Id and FCM Token are required" });
    }

    const updatedSession = await session.findByIdAndUpdate(sessionId, {
      fcmToken,
      lastUsedAt: new Date()
    }, { new: true });

    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }


    // Send test notification
    await sendTestNotification(fcmToken);

    return res.json({ message: "FCM Token stored successfully" });
  } catch (err) {
    console.error("Store push token error:", err);
    res.status(500).json({ message: "Failed to store push token" });
  }
};

const sendTestNotification = async (fcmToken) => {
  try {
    const message = {
      to: fcmToken,
      sound: 'default',
      title: 'FCM Token Registered! 🎉',
      body: 'Your device is now ready to receive push notifications.',
      data: { type: 'test', timestamp: Date.now() }
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
};

export const sendManualTestNotification = async (req, res) => {
  try {
    const { message, title } = req.body;
    const deviceUUID = req.headers['x-device-uuid'] || req.headers['X-Device-UUID'];

    if (!deviceUUID) {
      return res.status(400).json({ message: "Device UUID required" });
    }

    const userSession = await session.findOne({
      userId: req.user.id,
      deviceUUID,
      status: "Active"
    });

    if (!userSession?.fcmToken) {
      return res.status(404).json({ message: "No FCM token found for this device" });
    }

    const notification = {
      to: userSession.fcmToken,
      sound: 'default',
      title: title || 'Test Notification 📱',
      body: message || 'This is a manual test notification from your HR system.',
      data: { type: 'manual_test', timestamp: Date.now() }
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification)
    });

    const result = await response.json();

    return res.json({ message: "Test notification sent successfully", result });
  } catch (error) {
    console.error('Manual test notification error:', error);
    res.status(500).json({ message: "Failed to send test notification" });
  }
};