import { z } from "zod";
import { generateFlashcardsWithAi, reviewAnswerWithAi } from "../lib/ai-service.js";
import { recomputeUserProgress } from "../lib/progress.js";
import { prisma } from "../lib/prisma.js";

const generateSchema = z.object({
  estimatedReviewTime: z.string().optional(),
  cardsRequested: z.number().int().min(1).max(20).optional()
});

const reviewSchema = z.object({
  userAnswer: z.string().min(1)
});

const dueCardsQuerySchema = z.object({
  subjectId: z.string().optional(),
  chapterId: z.string().optional()
});

const ratingSchema = z.object({
  userAnswer: z.string().min(1),
  aiFeedback: z.object({
    score: z.number(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    improvedAnswer: z.string(),
    suggestedDifficulty: z.string(),
    debug: z
      .object({
        source: z.string(),
        reason: z.string()
      })
      .optional()
  })
});

function normalizeChapterTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function startOfLocalDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getTodayRange() {
  const start = startOfLocalDay();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function generateFlashcards(req, res) {
  const parsed = generateSchema.parse(req.body);
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: req.params.chapterId,
      subject: { userId: req.user.sub }
    },
    include: {
      notes: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found." });
  }

  const latestUsableNote = chapter.notes.find((note) => note.content?.trim());

  if (!latestUsableNote) {
    return res.status(400).json({
      message: "No readable note content found for this chapter. Paste text notes or upload a text-based PDF."
    });
  }

  const aiResult = await generateFlashcardsWithAi({
    notes: latestUsableNote.content,
    chapter_title: chapter.title,
    review_time_minutes: Number.parseInt(parsed.estimatedReviewTime ?? "20", 10) || 20,
    cards_requested: parsed.cardsRequested ?? 8
  });

  await prisma.flashCard.deleteMany({
    where: { chapterId: chapter.id }
  });

  const created = [];
  for (const flashcard of aiResult.flashcards ?? []) {
    const card = await prisma.flashCard.create({
      data: {
        chapterId: chapter.id,
        type: flashcard.type,
        question: flashcard.question,
        referenceAnswer: flashcard.referenceAnswer,
        hint: flashcard.hint,
        sourceSnippet: flashcard.sourceSnippet
      }
    });
    created.push(card);
  }

  await prisma.chapter.update({
    where: { id: chapter.id },
    data: {
      updatedAt: new Date()
    }
  });

  res.json({
    cards: created,
    debug: aiResult.debug
  });
}

export async function getDueCards(req, res) {
  const parsed = dueCardsQuerySchema.parse(req.query);
  const today = getTodayRange();
  const cards = await prisma.flashCard.findMany({
    where: {
      reviewAttempts: {
        none: {
          userId: req.user.sub,
          reviewedAt: {
            gte: today.start,
            lt: today.end
          }
        }
      },
      chapter: {
        ...(parsed.chapterId ? { id: parsed.chapterId } : {}),
        subject: {
          userId: req.user.sub,
          ...(parsed.subjectId ? { id: parsed.subjectId } : {})
        }
      }
    },
    include: {
      chapter: {
        include: {
          subject: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }]
  });

  const canonicalChapters = new Map();
  for (const card of cards) {
    const key = `${card.chapter.subject.id}:${normalizeChapterTitle(card.chapter.title)}`;
    const existing = canonicalChapters.get(key);
    const cardChapterTime = new Date(card.chapter.updatedAt ?? card.chapter.createdAt).getTime();
    const existingChapterTime = existing
      ? new Date(existing.updatedAt ?? existing.createdAt).getTime()
      : -Infinity;

    if (!existing || cardChapterTime > existingChapterTime) {
      canonicalChapters.set(key, {
        id: card.chapter.id,
        updatedAt: card.chapter.updatedAt,
        createdAt: card.chapter.createdAt
      });
    }
  }

  const filteredCards = cards.filter((card) => {
    const key = `${card.chapter.subject.id}:${normalizeChapterTitle(card.chapter.title)}`;
    return canonicalChapters.get(key)?.id === card.chapter.id;
  });

  res.json({
    cards: filteredCards.map((card) => ({
      id: card.id,
      subjectId: card.chapter.subject.id,
      chapterId: card.chapter.id,
      type: card.type,
      question: card.question,
      answer: card.referenceAnswer,
      hint: card.hint,
      chapterTitle: card.chapter.title,
      subjectTitle: card.chapter.subject.title
    }))
  });
}

export async function submitReview(req, res) {
  const parsed = reviewSchema.parse(req.body);
  const flashCard = await prisma.flashCard.findFirst({
    where: {
      id: req.params.flashCardId,
      chapter: {
        subject: {
          userId: req.user.sub
        }
      }
    }
  });

  if (!flashCard) {
    return res.status(404).json({ message: "Flashcard not found." });
  }

  const feedback = await reviewAnswerWithAi({
    question: flashCard.question,
    reference_answer: flashCard.referenceAnswer,
    user_answer: parsed.userAnswer
  });

  res.json({
    flashCardId: req.params.flashCardId,
    feedback
  });
}

export async function rateReview(req, res) {
  const parsed = ratingSchema.parse(req.body);
  const flashCard = await prisma.flashCard.findFirst({
    where: {
      id: req.params.flashCardId,
      chapter: {
        subject: {
          userId: req.user.sub
        }
      }
    }
  });

  if (!flashCard) {
    return res.status(404).json({ message: "Flashcard not found." });
  }

  await prisma.reviewAttempt.create({
    data: {
      flashCardId: flashCard.id,
      userId: req.user.sub,
      userAnswer: parsed.userAnswer,
      aiFeedback: parsed.aiFeedback,
      aiScore: parsed.aiFeedback.score
    }
  });

  await prisma.flashCard.update({
    where: { id: flashCard.id },
    data: {
      lastReviewedAt: new Date(),
      reviewCount: { increment: 1 },
      averageScore:
        flashCard.reviewCount === 0
          ? parsed.aiFeedback.score
          : (flashCard.averageScore * flashCard.reviewCount + parsed.aiFeedback.score) /
            (flashCard.reviewCount + 1)
    }
  });

  const day = startOfLocalDay();

  await prisma.dailyActivity.upsert({
    where: {
      userId_date: {
        userId: req.user.sub,
        date: day
      }
    },
    update: {
      cardsReviewed: { increment: 1 },
      minutesStudied: { increment: 5 },
      streakActive: true
    },
    create: {
      userId: req.user.sub,
      date: day,
      cardsReviewed: 1,
      minutesStudied: 5,
      streakActive: true
    }
  });

  await recomputeUserProgress(req.user.sub);

  res.json({
    flashCardId: req.params.flashCardId,
    feedback: parsed.aiFeedback
  });
}
