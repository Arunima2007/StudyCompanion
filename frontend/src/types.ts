export type User = {
  id: string;
  name: string;
  email: string;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
};

export type Subject = {
  id: string;
  title: string;
  description?: string;
  chapters: number;
  cardsDue: number;
  accent: string;
  chapterItems?: Array<{
    id: string;
    title: string;
    description?: string;
    notesCount: number;
    flashcardsCount: number;
  }>;
};

export type HeatmapDay = {
  date: string;
  value: number;
  count: number;
};

export type AiFeedback = {
  score: number;
  strengths: string[];
  gaps: string[];
  improvedAnswer: string;
  suggestedDifficulty: "easy" | "medium" | "hard";
  debug?: {
    source: string;
    reason: string;
  };
};

export type ReviewCard = {
  id: string;
  subjectId?: string;
  chapterId?: string;
  chapterTitle: string;
  subjectTitle?: string;
  type: string;
  question: string;
  answer: string;
  difficulty?: "easy" | "medium" | "hard";
  status?: "due" | "completed";
  userAnswer?: string;
  aiFeedback?: AiFeedback;
  nextReviewLabel?: string;
};
