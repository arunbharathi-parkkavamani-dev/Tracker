import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

export async function authMiddleware(req, res, next) {
  try {
    // 1. Retrieve token from cookie or Authorization header
    let token = req.cookies?.auth_token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }



    if (!token) return res.status(401).json({ error: "Unauthorized", action: "login" });

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Lookup user
    const user = await Employee.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ error: "User not found", action: "login" });

    // 4. Attach minimal safe user info with platform info
    req.user = {
      id: user._id,
      role: decoded.role,
      name: user.basicInfo?.firstName,
      email: user.authInfo?.workEmail,
      platform: decoded.platform || 'web',
    };

    next();
  } catch (err) {
    console.error("AuthMiddleware error:", err.message);
    
    // Handle JWT expiration
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token expired", 
        action: "refresh",
        expired: true 
      });
    }
    
    return res.status(401).json({ error: "Unauthorized", action: "login" });
  }
}
