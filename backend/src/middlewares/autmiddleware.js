import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

export async function authMiddleware(req, res, next) {
  try {
    // 1. Retrieve token from cookie or Authorization header
    let token = req.cookies?.auth_token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Lookup user
    const user = await Employee.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    // 4. Attach minimal safe user info
    req.user = {
      id: user._id,
      role: decoded.role,
      name: user.basicInfo?.firstName,
      email: user.authInfo?.workEmail,
    };

    next();
  } catch (err) {
    console.error("AuthMiddleware error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
