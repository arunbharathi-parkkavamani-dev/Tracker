import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "src/Config/.env") });

// Generate tokens with platform-specific expiration
const generateAccessToken = (payload, platform = 'web') => {
  const expiresIn = platform === 'mobile' ? '30d' : '60m'; // Mobile: 30 days, Web: 1 hour
  return jwt.sign({ 
    id: payload.id, 
    role: payload.role, 
    managerId: payload.managerId, 
    name: payload.name,
    platform 
  }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload, platform = 'web') => {
  const expiresIn = platform === 'mobile' ? '90d' : '7d'; // Mobile: 90 days, Web: 7 days
  return jwt.sign({ id: payload.id, platform }, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

// ------------------- LOGIN -------------------
export const login = async (req, res, next) => {
  try {
    const { workEmail, password, platform = 'web' } = req.body; // Accept platform from request
    const employee = await Employee.findOne({ "authInfo.workEmail": workEmail });
    if (!employee) return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const validPassword = await bcrypt.compare(password, employee.authInfo.password);
    if (!validPassword) return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const payload = {
      id: employee._id,
      name: employee.basicInfo.firstName,
      role: employee.professionalInfo.role,
      managerId: employee.professionalInfo.reportingManager,
    };

    const accessToken = generateAccessToken(payload, platform);
    const refreshToken = generateRefreshToken(payload, platform);

    // Set cookies only for web platform
    if (platform === 'web') {
      const accessMaxAge = 60 * 60 * 1000; // 1 hour
      const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      res.cookie("auth_token", accessToken, {
        httpOnly: false,
        secure: false, // Always false for development
        sameSite: "lax",
        maxAge: accessMaxAge,
        path: "/",
        domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined
      });
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: false, // Always false for development
        sameSite: "lax",
        maxAge: refreshMaxAge,
        path: "/",
        domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined
      });
    }

    res.json({ 
      message: "✅Login successful", 
      accessToken, 
      refreshToken,
      platform,
      expiresIn: platform === 'mobile' ? '30 days' : '1 hour'
    });
  } catch (err) {
    next(err);
  }
};

// ------------------- REFRESH -------------------
export const refresh = async (req, res, next) => {
  try {
    // Check both cookie and body for refresh token (mobile sends in body)
    const refreshToken = req.cookies["refresh_token"] || req.body.refreshToken;
    if (!refreshToken) return next(Object.assign(new Error("No refresh token provided"), { status: 401 }));

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return next(Object.assign(new Error("Invalid or expired refresh token"), { status: 403 }));

      // Get user details for new token
      const employee = await Employee.findById(decoded.id);
      if (!employee) return next(Object.assign(new Error("User not found"), { status: 404 }));

      const payload = {
        id: employee._id,
        name: employee.basicInfo.firstName,
        role: employee.professionalInfo.role,
        managerId: employee.professionalInfo.reportingManager,
      };

      const platform = decoded.platform || 'web';
      const newAccessToken = generateAccessToken(payload, platform);
      
      // Set cookie only for web platform
      if (platform === 'web') {
        res.cookie("auth_token", newAccessToken, {
          httpOnly: false,
          secure: false, // Always false for development
          sameSite: "lax",
          maxAge: 60 * 60 * 1000,
          path: "/",
          domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined
        });
      }
      
      res.json({ 
        message: "Token refreshed", 
        accessToken: newAccessToken,
        platform 
      });
    });
  } catch (err) {
    next(err);
  }
};

// ------------------- LOGOUT -------------------
export const logout = async (req, res, next) => {
  try {
    const { platform = 'web' } = req.body;
    
    // Clear cookies only for web platform
    if (platform === 'web') {
      res.clearCookie("auth_token");
      res.clearCookie("refresh_token");
    }
    
    res.json({ message: "Logged out successfully", platform });
  } catch (err) {
    next(err);
  }
};

// ------------------- AUTH MIDDLEWARE -------------------
export const authMiddleware = (req, res, next) => {
  const token = req.cookies["auth_token"];
  if (!token) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(Object.assign(new Error("Invalid or expired token"), { status: 403 }));
    req.user = decoded;
    next();
  });
};
