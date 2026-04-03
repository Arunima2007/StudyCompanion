import type { AiFeedback, HeatmapDay, ReviewCard, Subject, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "flash-card-generator.token";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    hasCompletedOnboardingTour: boolean;
  };
};

function mapUser(user: AuthResponse["user"]): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isNewUser: !user.hasCompletedOnboardingTour,
    hasCompletedOnboarding: user.hasCompletedOnboardingTour
  };
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch(path: string, init: RequestInit = {}, token = getStoredToken()) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function signup(input: { name: string; email: string; password: string }) {
  const data = (await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  })) as AuthResponse;
  setStoredToken(data.token);
  return mapUser(data.user);
}

export async function login(input: { email: string; password: string }) {
  const data = (await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  })) as AuthResponse;
  setStoredToken(data.token);
  return mapUser(data.user);
}

export async function googleLogin(credential: string) {
  const data = (await apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential })
  })) as AuthResponse;
  setStoredToken(data.token);
  return mapUser(data.user);
}

export async function getSession() {
  const data = (await apiFetch("/auth/session")) as {
    user: AuthResponse["user"] | null;
  };

  return data.user ? mapUser(data.user) : null;
}

export async function getSubjects() {
  const data = (await apiFetch("/subjects")) as {
    subjects: Array<{
      id: string;
      title: string;
      description?: string;
      color?: string;
      cardsDue: number;
      chapterCount: number;
      chapters: Array<{
        id: string;
        title: string;
        description?: string;
        notesCount: number;
        flashcardsCount: number;
      }>;
    }>;
  };

  return data.subjects.map<Subject>((subject) => ({
    id: subject.id,
    title: subject.title,
    description: subject.description,
    chapters: subject.chapterCount,
    cardsDue: subject.cardsDue,
    accent: "from-cyan-300 to-teal-500",
    chapterItems: subject.chapters
  }));
}

export async function createSubject(input: { title: string; description?: string }) {
  return apiFetch("/subjects", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createChapter(subjectId: string, input: { title: string; description?: string }) {
  return apiFetch(`/subjects/${subjectId}/chapters`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function uploadNotes(chapterId: string, input: { title: string; content: string }) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("content", input.content);

  return apiFetch(`/chapters/${chapterId}/notes`, {
    method: "POST",
    body: formData
  });
}

export async function generateFlashcards(chapterId: string, input: { estimatedReviewTime: string; cardsRequested?: number }) {
  return apiFetch(`/chapters/${chapterId}/generate-flashcards`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getDueCards(filters?: { subjectId?: string; chapterId?: string }) {
  const searchParams = new URLSearchParams();
  if (filters?.subjectId) {
    searchParams.set("subjectId", filters.subjectId);
  }
  if (filters?.chapterId) {
    searchParams.set("chapterId", filters.chapterId);
  }

  const query = searchParams.toString();
  const data = (await apiFetch(`/review/due${query ? `?${query}` : ""}`)) as { cards: ReviewCard[] };
  return data.cards;
}

export async function submitReview(
  flashCardId: string,
  input: { userAnswer: string }
) {
  const data = (await apiFetch(`/review/${flashCardId}/submit`, {
    method: "POST",
    body: JSON.stringify(input)
  })) as { feedback: AiFeedback };
  return data;
}

export async function rateReview(
  flashCardId: string,
  input: { userAnswer: string; difficultyLabel: "easy" | "medium" | "hard"; aiFeedback: AiFeedback }
) {
  const data = (await apiFetch(`/review/${flashCardId}/rate`, {
    method: "POST",
    body: JSON.stringify(input)
  })) as { feedback: AiFeedback; nextReviewAt: string };
  return data;
}

export async function getProgressOverview() {
  return (await apiFetch("/progress/overview")) as {
    currentStreak: number;
    maxStreak: number;
    maxActiveDays: number;
    totalStudyDays: number;
    weeklyProgress: Array<{ day: string; reviewed: number; retention: number }>;
    heatmap: HeatmapDay[];
  };
}

export async function getProfileStats() {
  return (await apiFetch("/profile/stats")) as {
    user: { name: string; email: string };
    currentStreak: number;
    maxStreak: number;
    maxActiveDays: number;
    totalStudyDays: number;
    totalFlashcardsCreated: number;
    totalFlashcardsReviewed: number;
    strongestSubject: string;
    weakestSubject: string;
  };
}
