import type { AiFeedback, ReviewCard } from "../types";

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? "http://localhost:8000";

type FlashcardApiResponse = {
  flashcards: Array<{
    type: string;
    question: string;
    referenceAnswer: string;
    hint?: string;
    sourceSnippet?: string;
  }>;
  debug?: {
    source: string;
    reason: string;
  };
};

type ReviewApiResponse = {
  score: number;
  strengths: string[];
  gaps: string[];
  improvedAnswer: string;
  suggestedDifficulty: string;
  debug?: {
    source: string;
    reason: string;
  };
};

export async function extractTextFromPdf(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${AI_SERVICE_URL}/parse-pdf`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Could not extract text from the uploaded PDF.");
  }

  return (await response.json()) as { filename: string; text: string };
}

export async function generateFlashcardsWithAi(input: {
  subjectId: string;
  chapterTitle: string;
  notes: string;
  reviewTime: string;
  cardsRequested?: number;
}) {
  const reviewTimeMinutes = Number.parseInt(input.reviewTime, 10) || 20;
  const response = await fetch(`${AI_SERVICE_URL}/flashcards/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      notes: input.notes,
      chapter_title: input.chapterTitle,
      review_time_minutes: reviewTimeMinutes,
      cards_requested: input.cardsRequested ?? 6
    })
  });

  if (!response.ok) {
    throw new Error("Flashcard generation failed.");
  }

  const data = (await response.json()) as FlashcardApiResponse;

  const cards = data.flashcards.map<ReviewCard>((flashcard) => ({
    id: `card-${crypto.randomUUID()}`,
    subjectId: input.subjectId,
    chapterTitle: input.chapterTitle,
    type: flashcard.type,
    question: flashcard.question,
    answer: flashcard.referenceAnswer,
    status: "due",
    difficulty: "medium"
  }));

  return {
    cards,
    debug: data.debug
  };
}

export async function reviewAnswerWithAi(input: {
  question: string;
  referenceAnswer: string;
  userAnswer: string;
}) {
  const response = await fetch(`${AI_SERVICE_URL}/flashcards/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question: input.question,
      reference_answer: input.referenceAnswer,
      user_answer: input.userAnswer
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "AI review failed.");
  }

  const data = (await response.json()) as ReviewApiResponse;

  const normalizedDifficulty = data.suggestedDifficulty.toLowerCase();

  return {
    score: data.score,
    strengths: Array.isArray(data.strengths) ? data.strengths : ["No strengths returned."],
    gaps: Array.isArray(data.gaps) ? data.gaps : ["No gaps returned."],
    improvedAnswer: data.improvedAnswer,
    suggestedDifficulty:
      normalizedDifficulty === "easy" ||
      normalizedDifficulty === "medium" ||
      normalizedDifficulty === "hard"
        ? normalizedDifficulty
        : "medium",
    debug: data.debug
  } satisfies AiFeedback;
}
