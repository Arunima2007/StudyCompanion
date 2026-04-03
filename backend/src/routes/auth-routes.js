import { Router } from "express";
import {
  completeTour,
  googleLogin,
  login,
  logout,
  me,
  signup
} from "../controllers/auth-controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(signup));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/google", asyncHandler(googleLogin));
authRouter.get("/me", requireAuth, asyncHandler(me));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post("/complete-tour", requireAuth, asyncHandler(completeTour));
