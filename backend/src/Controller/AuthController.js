import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "src/Config/.env") });

// Generate tokens
const generateAccessToken = (payload) =>
  jwt.sign({ id: payload.id, role: payload.role, managerId: payload.managerId, name:payload.name }, process.env.JWT_SECRET, { expiresIn: "60m" });

const generateRefreshToken = (payload) =>
  jwt.sign({ id: payload.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "1d" });

// ------------------- LOGIN -------------------
export const login = async (req, res, next) => {
  try {
    const { workEmail, password } = req.body;
    const employee = await Employee.findOne({ "authInfo.workEmail": workEmail });
    if (!employee) return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const validPassword = bcrypt.compare(password, employee.authInfo.password);
    if (!validPassword) return next(Object.assign(new Error("❎Invalid email or password"), { status: 401 }));

    const payload = {
      id: employee._id,
      name : employee.basicInfo.firstName,
      role: employee.professionalInfo.role,
      managerId: employee.professionalInfo.reportingManager,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("auth_token", accessToken, {
      httpOnly: false, // Allow frontend access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "✅Login successful", accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ------------------- REFRESH -------------------
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken) return next(Object.assign(new Error("No refresh token provided"), { status: 401 }));

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return next(Object.assign(new Error("Invalid or expired refresh token"), { status: 403 }));

      const newAccessToken = generateAccessToken({ id: decoded.id, role: decoded.role, managerId: decoded.managerId });
      res.cookie("auth_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });
      res.json({ message: "Token refreshed" });
    });
  } catch (err) {
    next(err);
  }
};

// ------------------- LOGOUT -------------------
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("auth_token");
    res.clearCookie("refresh_token");
    res.json({ message: "Logged out successfully" });
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
