import { verifyToken } from "../lib/jwt.js";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = req.cookies?.[env.jwtCookieName] ?? bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
