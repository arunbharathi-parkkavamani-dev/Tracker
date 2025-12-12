import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import tokenGenrator from "../middlewares/tokenGenrator.js";
import session from "../models/Session.js";


const JWT_SECRET = tokenGenrator();
const JWT_REFRESH_SECRET = tokenGenrator();

// Generate tokens with platform-specific expiration
const generateAccessToken = (payload, platform = 'web') => {
  const expiresIn = platform === 'mobile' ? '30d' : '60m'; // Mobile: 30 days, Web: 1 hour
  return jwt.sign({
    id: payload.id,
    role: payload.role,
    managerId: payload.managerId,
    name: payload.name,
    platform
  }, JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload, platform = 'web') => {
  const expiresIn = platform === 'mobile' ? '90d' : '7d'; // Mobile: 90 days, Web: 7 days
  return jwt.sign({ id: payload.id, platform }, JWT_REFRESH_SECRET, { expiresIn });
};

// ------------------- LOGIN -------------------
export const login = async (req, res, next) => {
  try {
    const { workEmail, password, platform = "web" } = req.body;

    const employee = await Employee.findOne({
      "authInfo.workEmail": workEmail
    });

    if (!employee)
      return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const validPassword = await bcrypt.compare(password, employee.authInfo.password);
    if (!validPassword)
      return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const payload = {
      id: employee._id,
      name: employee.basicInfo.firstName,
      role: employee.professionalInfo.role,
      managerId: employee.professionalInfo.reportingManager
    };

    const accessToken = generateAccessToken(payload, platform);
    const refreshToken = generateRefreshToken(payload, platform);

    const expiresIn = platform === "mobile" ? "30 days" : "1 hour";

    if (platform === "web") {
      res.cookie("auth_token", accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    res.json({
      message: "✅Login successful",
      accessToken,
      refreshToken,
      platform,
      expiresIn
    });

    await afterLogin(payload.id, accessToken, JWT_SECRET, expiresIn, refreshToken, JWT_REFRESH_SECRET, platform);

  } catch (err) {
    next(err);
  }
};

// ------------------- REFRESH -------------------
export const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies["refresh_token"] || req.body.refreshToken;

    if (!refreshToken)
      return next(Object.assign(new Error("No refresh token provided"), { status: 401 }));

    const decoded = jwt.decode(refreshToken);
    if (!decoded)
      return next(Object.assign(new Error("Invalid refresh token"), { status: 403 }));

    const lastSession = await session.findOne({ userId: decoded.id });

    if (!lastSession)
      return next(Object.assign(new Error("Session not found"), { status: 404 }));

    jwt.verify(refreshToken, lastSession.refreshToken.token, async (err, user) => {
      if (err)
        return next(Object.assign(new Error("Expired refresh token"), { status: 403 }));

      const employee = await Employee.findById(user.id);

      const payload = {
        id: employee._id,
        name: employee.basicInfo.firstName,
        role: employee.professionalInfo.role,
        managerId: employee.professionalInfo.reportingManager
      };

      const newAccessToken = generateAccessToken(payload, user.platform);

      if (user.platform === "web") {
        res.cookie("auth_token", newAccessToken, {
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 1000,
          path: "/",
        });
      }

      res.json({
        message: "Token refreshed",
        accessToken: newAccessToken,
        platform: user.platform
      });

      await afterRefresh(user.id, newAccessToken);
    });

  } catch (err) {
    next(err);
  }
};


// ------------------- LOGOUT -------------------
export const logout = async (req, res, next) => {
  try {
    const { platform = 'web' } = req.body;

    await afterLogout(decoded.id);

    // Clear cookies only for web platform
    if (platform === 'web') {
      res.clearCookie("auth_token");
      res.clearCookie("refresh_token");
    }

    res.json({ message: "Logged out successfully", platform });
    afterLogout();
  } catch (err) {
    next(err);
  }
};

// ------------------- AUTH MIDDLEWARE -------------------
export const authMiddleware = async(req, res, next) => {
  const token = req.cookies["auth_token"];
  if (!token) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));

  const decoded = jwt.decode(token);
    if (!decoded)
      return next(Object.assign(new Error("Invalid Auth token"), { status: 403 }));

    const lastSession = await session.findOne({ userId: decoded.id });

    if (!lastSession)
      return next(Object.assign(new Error("Session not found"), { status: 404 }));


  jwt.verify(token, lastSession.generatedToken.token, (err, decoded) => {
    if (err) return next(Object.assign(new Error("Invalid or expired token"), { status: 403 }));
    req.user = decoded;
    next();
  });
}


const afterLogin = async (userId, token, secret, expiry, refreshToken, refreshSecret, platform) => {
  try {
    const newSession = new session({
      userId,
      generatedToken: { token, secret, expiry },
      refreshToken: { token: refreshToken, secret:refreshToken, expiry: "7d" },
      platform,
      status: "Active"
    });

    await newSession.save();
  } catch (err) {
    console.log("Session save error:", err);
  }
};



const afterRefresh = async (userId, newAccessToken) => {
  try {
    await session.findOneAndUpdate(
      { userId, status: "Active" },
      {
        "generatedToken.token": newAccessToken,
        "generatedToken.expiry": "1h"
      }
    );
  } catch (err) {
    console.log("afterRefresh error:", err);
  }
};

const afterLogout = async (userId) => {
  try {
    await session.findOneAndUpdate(
      { userId, status: "Active" },
      { status: "DeActive" }
    );
  } catch (err) {
    console.log("afterLogout error:", err);
  }
};

