import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { buildSessionCookieOptions, signToken } from "../lib/jwt.js";

const googleClient = new OAuth2Client(env.googleClientId);

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const googleSchema = z.object({
  credential: z.string().min(10)
});

function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.image ?? null,
    hasCompletedTour: user.hasCompletedOnboardingTour,
    studyingSince: user.createdAt
  };
}

function writeSessionCookie(res, token) {
  res.cookie(env.jwtCookieName, token, buildSessionCookieOptions());
}

export async function signup(req, res) {
  const parsed = signupSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });

  if (existing) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      hasCompletedOnboardingTour: false
    }
  });

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  writeSessionCookie(res, token);

  return res.status(201).json({
    user: mapUser(user),
    isNewUser: !user.hasCompletedOnboardingTour
  });
}

export async function login(req, res) {
  const parsed = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: parsed.email } });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isValid = await bcrypt.compare(parsed.password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  writeSessionCookie(res, token);

  return res.json({
    user: mapUser(user),
    isNewUser: !user.hasCompletedOnboardingTour
  });
}

export async function googleLogin(req, res) {
  const parsed = googleSchema.parse(req.body);

  if (!env.googleClientId) {
    return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured." });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: parsed.credential,
    audience: env.googleClientId
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    return res.status(400).json({ message: "Invalid Google credential." });
  }

  let user = await prisma.user.findUnique({
    where: { email: payload.email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name ?? payload.email.split("@")[0],
        googleId: payload.sub,
        hasCompletedOnboardingTour: false
      }
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub }
    });
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  writeSessionCookie(res, token);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return res.json({
    user: mapUser(user),
    isNewUser: !user.hasCompletedOnboardingTour
  });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub }
  });

  if (!user) {
    res.clearCookie(env.jwtCookieName, buildSessionCookieOptions());
    return res.status(401).json({ message: "Session expired." });
  }

  return res.json({ user: mapUser(user) });
}

export async function logout(_req, res) {
  res.clearCookie(env.jwtCookieName, buildSessionCookieOptions());
  return res.status(204).send();
}

export async function completeTour(req, res) {
  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: { hasCompletedOnboardingTour: true }
  });

  return res.json({ user: mapUser(user) });
}
