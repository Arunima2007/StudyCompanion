import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true
});

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function googleLogin(credential) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function completeTour() {
  const { data } = await api.post("/auth/complete-tour");
  return data.user;
}

export async function getDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}

export async function getSubjects() {
  const { data } = await api.get("/subjects");
  return data.subjects;
}

export async function createSubject(payload) {
  const { data } = await api.post("/subjects", payload);
  return data.subject;
}

export async function createChapter(subjectId, payload) {
  const { data } = await api.post(`/subjects/${subjectId}/chapters`, payload);
  return data.chapter;
}

export async function uploadNotes(chapterId, payload) {
  const formData = new FormData();
  if (payload.title) formData.append("title", payload.title);
  if (payload.content) formData.append("content", payload.content);
  if (payload.file) formData.append("file", payload.file);

  const { data } = await api.post(`/chapters/${chapterId}/notes`, formData);
  return data.note;
}

export async function generateFlashcards(chapterId, payload) {
  const { data } = await api.post(`/chapters/${chapterId}/generate-flashcards`, payload);
  return data;
}

export async function getDueCards(filters) {
  const { data } = await api.get("/review/due", {
    params: {
      ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters?.chapterId ? { chapterId: filters.chapterId } : {})
    }
  });
  return data.cards;
}

export async function submitReview(flashCardId, userAnswer) {
  const { data } = await api.post(`/review/${flashCardId}/submit`, { userAnswer });
  return data.feedback;
}

export async function rateReview(flashCardId, payload) {
  const { data } = await api.post(`/review/${flashCardId}/rate`, payload);
  return data;
}

export async function getProgress(range) {
  const { data } = await api.get("/progress/overview", {
    params: { range }
  });
  return data;
}

export async function getProfileStats() {
  const { data } = await api.get("/profile/stats");
  return data;
}
