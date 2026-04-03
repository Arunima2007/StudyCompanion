import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/"
  };
}
