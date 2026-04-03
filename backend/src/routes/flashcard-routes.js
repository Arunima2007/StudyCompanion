import { Router } from "express";
import {
  generateFlashcards,
  getDueCards,
  rateReview,
  submitReview
} from "../controllers/flashcard-controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

export const flashcardRouter = Router();

flashcardRouter.use(requireAuth);
flashcardRouter.post("/chapters/:chapterId/generate-flashcards", asyncHandler(generateFlashcards));
flashcardRouter.get("/review/due", asyncHandler(getDueCards));
flashcardRouter.post("/review/:flashCardId/submit", asyncHandler(submitReview));
flashcardRouter.post("/review/:flashCardId/rate", asyncHandler(rateReview));
