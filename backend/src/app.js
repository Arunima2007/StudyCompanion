import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth-routes.js";
import { flashcardRouter } from "./routes/flashcard-routes.js";
import { progressRouter } from "./routes/progress-routes.js";
import { studyRouter } from "./routes/study-routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api", studyRouter);
app.use("/api", flashcardRouter);
app.use("/api", progressRouter);

app.use(errorHandler);
