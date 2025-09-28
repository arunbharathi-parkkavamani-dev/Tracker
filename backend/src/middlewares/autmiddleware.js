// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

export async function authMiddleware(req, res, next) {
  try {
    console.log("Authenticating request...", req.cookies, req.originalUrl);
    // 1. Check cookie (auth_token)
    let token = req.cookies?.auth_token;
    console.log("Token from cookie:", token);

    // 2. Check Authorization header
    if (!token && req.headers.authorization) {
      console.log("reading token from Authorization header");
      const [scheme, credentials] = req.headers.authorization.split(" ");
      if (scheme === "Bearer") token = credentials;
    }

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // 3. Verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Lookup user
    const user = await Employee.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    // 5. Attach user with role from token (safer than DB override)
    req.user = { ...user, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
