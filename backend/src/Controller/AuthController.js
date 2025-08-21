// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import  Employee  from '../models/Employee.js';
import dotenv from "dotenv";
dotenv.config({ path: './src/config/.env' })

// helper to generate tokens
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60m' }); // 1 hour
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); // 1 day
};

// ------------------- LOGIN -------------------
export const login = async (req, res, next) => {
  try {
    const { workEmail, password } = req.body;

    const employee = await Employee.findOne({ 'professionalInfo.workEmail': workEmail });
    if (!employee) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      return next(err);
    }

    const validPassword = await bcrypt.compare(password, employee.professionalInfo.password);
    if (!validPassword) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      return next(err);
    }

    const payload = { 
      id: employee._id,
      name: employee.basicInfo.firstName,
      profileImage: employee.basicInfo.profileImage,
      role: employee.professionalInfo.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // send cookies
    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    next(err);
  }
};

// ------------------- REFRESH -------------------
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      const err = new Error('No refresh token provided');
      err.status = 401;
      return next(err);
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded) => {
      if (err) {
        const error = new Error('Invalid or expired refresh token');
        error.status = 403;
        return next(error);
      }

      const newAccessToken = generateAccessToken({ id: decoded.id, role: decoded.role });

      res.cookie('auth_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.json({ message: 'Token refreshed' });
    });
  } catch (err) {
    next(err);
  }
};

// ------------------- LOGOUT -------------------
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ------------------- AUTH MIDDLEWARE -------------------
export const authMiddleware = (req, res, next) => {
  const token = req.cookies['auth_token'];
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const error = new Error('Invalid or expired token');
      error.status = 403;
      return next(error);
    }

    req.user = decoded;
    next();
  });
};