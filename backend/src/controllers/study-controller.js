import { z } from "zod";
import { parsePdfWithAi } from "../lib/ai-service.js";
import { prisma } from "../lib/prisma.js";

const subjectSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional()
});

const chapterSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional()
});

function normalizeChapterTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickCanonicalChapter(chapters) {
  return [...chapters].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.updatedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  })[0];
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function listSubjects(req, res) {
  const today = getTodayRange();
  const subjects = await prisma.subject.findMany({
    where: { userId: req.user.sub },
    include: {
      chapters: {
        include: {
          notes: true,
          flashCards: {
            include: {
              reviewAttempts: {
                where: {
                  userId: req.user.sub,
                  reviewedAt: {
                    gte: today.start,
                    lt: today.end
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    subjects: subjects.map((subject) => {
      const groupedChapters = new Map();

      for (const chapter of subject.chapters) {
        const key = normalizeChapterTitle(chapter.title);
        const group = groupedChapters.get(key) ?? [];
        group.push(chapter);
        groupedChapters.set(key, group);
      }

      const mergedChapters = Array.from(groupedChapters.values()).map((chapters) => {
        const canonicalChapter = pickCanonicalChapter(chapters);
        const allNotes = chapters.flatMap((chapter) => chapter.notes);
        return {
          id: canonicalChapter.id,
          title: canonicalChapter.title,
          description: canonicalChapter.description,
          notesCount: allNotes.length,
          flashcardsCount: canonicalChapter.flashCards.length,
          cardsDue: canonicalChapter.flashCards.filter((card) => card.reviewAttempts.length === 0).length,
          latestNoteAt: [...allNotes]
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]
            ?.createdAt ?? null
        };
      });

      return {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        color: subject.color,
        emoji: subject.description?.startsWith("emoji:") ? subject.description.replace("emoji:", "").trim() : undefined,
        chapters: mergedChapters,
        chapterCount: mergedChapters.length,
        cardsDue: mergedChapters.reduce((total, chapter) => total + chapter.cardsDue, 0)
      };
    })
  });
}

export async function createSubject(req, res) {
  const parsed = subjectSchema.parse(req.body);
  const subject = await prisma.subject.create({
    data: {
      userId: req.user.sub,
      title: parsed.title,
      description: parsed.emoji ? `emoji: ${parsed.emoji}` : parsed.description,
      color: parsed.color ?? "#6C5CE7"
    }
  });

  res.status(201).json({ subject });
}

export async function createChapter(req, res) {
  const parsed = chapterSchema.parse(req.body);
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.subjectId, userId: req.user.sub }
  });

  if (!subject) {
    return res.status(404).json({ message: "Subject not found." });
  }

  const existingChapter = await prisma.chapter.findFirst({
    where: {
      subjectId: subject.id,
      title: {
        equals: parsed.title.trim(),
        mode: "insensitive"
      }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });

  if (existingChapter) {
    return res.status(200).json({ chapter: existingChapter, reused: true });
  }

  const chapter = await prisma.chapter.create({
    data: {
      subjectId: subject.id,
      title: parsed.title,
      description: parsed.description
    }
  });

  res.status(201).json({ chapter });
}

export async function uploadNotes(req, res) {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: req.params.chapterId,
      subject: {
        userId: req.user.sub
      }
    }
  });

  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found." });
  }

  let content = req.body.content ?? "";
  const fileName = req.file?.originalname ?? "";
  const isPdfUpload =
    req.file?.mimetype === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isPlainTextUpload =
    req.file?.mimetype?.startsWith("text/") || fileName.toLowerCase().endsWith(".txt");

  if (isPdfUpload) {
    const parsed = await parsePdfWithAi(req.file.buffer, req.file.originalname);
    content = parsed.text;
  }

  if (isPlainTextUpload && !content && req.file?.buffer) {
    content = req.file.buffer.toString("utf-8");
  }

  if (!content.trim()) {
    return res.status(400).json({
      message: "We could not extract readable text from that file. Paste the notes directly or upload a text-based PDF/TXT file."
    });
  }

  const note = await prisma.note.create({
    data: {
      chapterId: req.params.chapterId,
      title: req.body.title ?? req.file?.originalname ?? "Study note",
      content,
      fileUrl: req.file?.filename ? `/uploads/${req.file.filename}` : undefined
    }
  });

  await prisma.chapter.update({
    where: { id: req.params.chapterId },
    data: {
      updatedAt: new Date()
    }
  });

  res.status(201).json({ note });
}
