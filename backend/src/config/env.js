import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtCookieName: process.env.JWT_COOKIE_NAME ?? "flashr_session",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000"
};
