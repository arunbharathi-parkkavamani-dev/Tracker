import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import session from "../models/Session.js";
import { generateSecret, generateJti } from "../utils/tokenGenrator.js";
import { getDeviceInfo } from "../utils/deviceInfo.js";

/* -------------------------------- LOGIN -------------------------------- */

export const login = async (req, res, next) => {
  try {
    const { workEmail, password, platform = "web" } = req.body;

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
      name: employee.basicInfo.firstName,
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
    const session = await session.create({
      userId: payload.id,
      platform,
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
      sessionId: session._id,
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

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Decode to get userId
    const decoded = jwt.decode(token);
    if (!decoded?.id)
      return res.status(401).json({ message: "Invalid token" });

    const session = await session.findOne({
      userId: decoded.id,
      platform: decoded.platform,
      status: "Active",
    });

    if (!session)
      return res.status(401).json({ message: "Session not found" });

    // Verify with stored secret
    jwt.verify(token, session.generatedToken.secret);

    session.lastUsedAt = new Date();
    await session.save();

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

    const session = await session.findOne({
      userId: decoded.id,
      platform: decoded.platform,
      status: "Active",
    });

    if (!session)
      return res.status(401).json({ message: "Session not found" });

    // Verify signature
    jwt.verify(refreshToken, session.refreshToken.secret);

    // jti check (REPLAY PROTECTION)
    if (decoded.jti !== session.refreshToken.jti) {
      session.status = "DeActive";
      await session.save();
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

    session.generatedToken = {
      token: newAccessToken,
      secret: newAccessSecret,
      expiry: "1h",
    };

    session.refreshToken = {
      token: newRefreshToken,
      secret: newRefreshSecret,
      jti: newJti,
      expiry: "7d",
    };

    session.lastUsedAt = new Date();
    await session.save();

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
    const token = req.cookies?.auth_token;
    if (!token) return res.json({ message: "Already logged out" });

    const decoded = jwt.decode(token);
    if (!decoded?.id) return res.json({ message: "Invalid token" });

    await Session.findOneAndUpdate(
      { userId: decoded.id, platform: decoded.platform },
      { status: "DeActive" }
    );

    res.clearCookie("auth_token");
    res.clearCookie("refresh_token");

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};



export const storePushToken = async (res, req, next) => {
  try { 
    const {sessionId, fcmToken} = req.body;

    if(!sessionId || !fcmToken) {
      return res.status(400).json({message: "Session Id and FCM Token are required"});
    }

    await session.findByIdAndUpdate(sessionId, {
      fcmToken,
      lastUsedAt: new Date()
    });

    return res.json({message: "FCM Token stored successfully"});
  } catch (err) {
    console.error("Store push token error:", err);
    res.status(500).json({ message: "Failed to store push token" });
  }
}