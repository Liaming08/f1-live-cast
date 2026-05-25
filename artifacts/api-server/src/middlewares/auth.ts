import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export interface AuthenticatedRequest extends Request {
  adminToken?: string;
}

export const adminAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization" });
    return;
  }

  const token = authHeader.substring(7);
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    logger.warn("ADMIN_PASSWORD not set in environment");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  // Simple token validation (base64 encoded password in production use JWT)
  if (token !== Buffer.from(adminPassword).toString("base64")) {
    res.status(403).json({ error: "Invalid admin token" });
    return;
  }

  req.adminToken = token;
  next();
};
