import { Router } from "express";
import {
  createChapter,
  createSubject,
  listSubjects,
  uploadNotes
} from "../controllers/study-controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

export const studyRouter = Router();

studyRouter.use(requireAuth);
studyRouter.get("/subjects", asyncHandler(listSubjects));
studyRouter.post("/subjects", asyncHandler(createSubject));
studyRouter.post("/subjects/:subjectId/chapters", asyncHandler(createChapter));
studyRouter.post("/chapters/:chapterId/notes", upload.single("file"), asyncHandler(uploadNotes));
