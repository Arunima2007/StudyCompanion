import type { HeatmapDay, ReviewCard, Subject } from "../types";

export const dashboardStats = [
  { label: "Cards Due Today", value: "18", tone: "bg-coral/15 text-coral" },
  { label: "Current Streak", value: "12 days", tone: "bg-teal/15 text-teal" },
  { label: "Max Streak", value: "28 days", tone: "bg-amber-100 text-amber-700" },
  { label: "Review Sessions", value: "94", tone: "bg-sky-100 text-sky-700" }
];

export const subjects: Subject[] = [
  {
    id: "s1",
    title: "Biology",
    chapters: 6,
    cardsDue: 12,
    accent: "from-emerald-300 to-teal-500"
  },
  {
    id: "s2",
    title: "History",
    chapters: 4,
    cardsDue: 3,
    accent: "from-orange-300 to-rose-500"
  },
  {
    id: "s3",
    title: "Computer Networks",
    chapters: 8,
    cardsDue: 9,
    accent: "from-indigo-300 to-violet-500"
  }
];

export const weeklyProgress = [
  { day: "Mon", reviewed: 22, retention: 75 },
  { day: "Tue", reviewed: 16, retention: 80 },
  { day: "Wed", reviewed: 28, retention: 78 },
  { day: "Thu", reviewed: 18, retention: 82 },
  { day: "Fri", reviewed: 35, retention: 88 },
  { day: "Sat", reviewed: 14, retention: 70 },
  { day: "Sun", reviewed: 20, retention: 84 }
];

export const heatmapData: HeatmapDay[] = Array.from({ length: 35 }, (_, index) => ({
  date: `2026-03-${String(index + 1).padStart(2, "0")}`,
  value: [0, 1, 2, 3, 4][index % 5],
  count: [0, 1, 2, 3, 4][index % 5]
}));

export const dueCards: ReviewCard[] = [
  {
    id: "c1",
    chapterTitle: "Cell Division",
    type: "Concept Explanation",
    question: "Explain the difference between mitosis and meiosis.",
    answer:
      "Mitosis creates two identical diploid cells for growth and repair, while meiosis creates four genetically varied haploid cells for reproduction."
  },
  {
    id: "c2",
    chapterTitle: "TCP Fundamentals",
    type: "Application",
    question: "Why does TCP use a three-way handshake before data transfer?",
    answer:
      "It synchronizes sequence numbers, confirms both sides can send and receive, and reduces stale connection issues."
  }
];
