import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import session from "../models/Session.js";

export const authMiddleware = async (req, res, next) => {
  console.log("Authenticating request...");
  try {
    const token = req.cookies["auth_token"] || 
      (req.headers.authorization?.startsWith("Bearer ") &&
       req.headers.authorization.split(" ")[1]);

    if (!token)
      return next(Object.assign(new Error("Unauthorized"), { status: 401 }));

    // Step 1: decode to get userId only
    const decoded = jwt.decode(token);
    if (!decoded)
      return next(Object.assign(new Error("Invalid token"), { status: 403 }));

    // Step 2: get session which contains the real secret
    const lastSession = await session.findOne({ userId: decoded.id });

    if (!lastSession)
      return next(Object.assign(new Error("Session not found"), { status: 404 }));

    // Step 3: verify token with per-session secret
    jwt.verify(token, lastSession.generatedToken.secret, (err, payload) => {
      if (err) 
        return next(Object.assign(new Error("Invalid or expired token"), { status: 403 }));

      // <= VERY IMPORTANT: your full token payload becomes req.user
      req.user = {
        id: payload.id,
        role: payload.role,
        name: payload.name,
        managerId: payload.managerId,
        platform: payload.platform
      };

      next();
    });

  } catch (err) {
    console.log("Auth error", err);
    next(Object.assign(new Error("Unauthorized"), { status: 401 }));
  }
};
