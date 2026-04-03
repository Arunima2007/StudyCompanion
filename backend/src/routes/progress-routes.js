import { Router } from "express";
import { dashboard, overview, profileStats } from "../controllers/progress-controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const progressRouter = Router();

progressRouter.use(requireAuth);
progressRouter.get("/dashboard", asyncHandler(dashboard));
progressRouter.get("/progress/overview", asyncHandler(overview));
progressRouter.get("/profile/stats", asyncHandler(profileStats));
