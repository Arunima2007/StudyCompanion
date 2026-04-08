import { prisma } from "../lib/prisma.js";

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

function mergeSubjectChapters(subjects, now = new Date()) {
  return subjects.map((subject) => {
    const groupedChapters = new Map();

    for (const chapter of subject.chapters) {
      const key = normalizeChapterTitle(chapter.title);
      const group = groupedChapters.get(key) ?? [];
      group.push(chapter);
      groupedChapters.set(key, group);
    }

    const chapters = Array.from(groupedChapters.values()).map((chaptersInGroup) => {
      const canonicalChapter = pickCanonicalChapter(chaptersInGroup);
      return {
        id: canonicalChapter.id,
        title: canonicalChapter.title,
        flashCards: canonicalChapter.flashCards,
        dueCount: canonicalChapter.flashCards.filter(
          (card) => !card.nextReviewAt || card.nextReviewAt <= now
        ).length
      };
    });

    return {
      ...subject,
      mergedChapters: chapters
    };
  });
}

function formatLocalDateKey(input) {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function incrementCount(map, key, amount) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function getReviewedCount(dateKey, activityCountsByDate, attemptCountsByDate) {
  const attemptCount = attemptCountsByDate.get(dateKey);
  if (typeof attemptCount === "number") {
    return attemptCount;
  }

  return activityCountsByDate.get(dateKey) ?? 0;
}

function getRangeStart(range) {
  const today = new Date();
  const start = new Date(today);

  if (range === "week") {
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "month") {
    start.setDate(today.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
}

export async function dashboard(req, res) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub }
  });

  const subjects = await prisma.subject.findMany({
    where: { userId: req.user.sub },
    include: {
      chapters: {
        include: {
          flashCards: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  const mergedSubjects = mergeSubjectChapters(subjects, now);

  const recentAttempts = await prisma.reviewAttempt.findMany({
    where: { userId: req.user.sub },
    orderBy: { reviewedAt: "desc" },
    take: 8,
    include: {
      flashCard: {
        include: {
          chapter: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  const totalCards = mergedSubjects.reduce(
    (total, subject) =>
      total +
      subject.mergedChapters.reduce(
        (chapterTotal, chapter) => chapterTotal + chapter.flashCards.length,
        0
      ),
    0
  );

  const dueToday = mergedSubjects.reduce(
    (total, subject) =>
      total +
      subject.mergedChapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.dueCount, 0),
    0
  );

  const avgAccuracy =
    recentAttempts.length === 0
      ? 0
      : Math.round(recentAttempts.reduce((total, attempt) => total + attempt.aiScore, 0) / recentAttempts.length);

  res.json({
    user: {
      name: user?.name ?? "Student"
    },
    stats: {
      dueToday,
      currentStreak: user?.currentStreak ?? 0,
      totalCards,
      avgAccuracy
    },
    subjects: mergedSubjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      color: subject.color ?? "#6C5CE7",
      cards: subject.mergedChapters.reduce(
        (total, chapter) => total + chapter.flashCards.length,
        0
      ),
      due: subject.mergedChapters.reduce((total, chapter) => total + chapter.dueCount, 0)
    })),
    recentActivity: recentAttempts.map((attempt) => ({
      id: attempt.id,
      reviewedAt: attempt.reviewedAt,
      subject: attempt.flashCard.chapter.subject.title,
      chapter: attempt.flashCard.chapter.title,
      score: Math.round(attempt.aiScore),
      difficulty: attempt.difficultyLabel.toLowerCase()
    }))
  });
}

export async function overview(req, res) {
  const range = String(req.query.range ?? "week");
  const rangeStart = getRangeStart(range);

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub }
  });

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId: req.user.sub,
      ...(rangeStart ? { date: { gte: rangeStart } } : {})
    },
    orderBy: { date: "asc" }
  });

  const attempts = await prisma.reviewAttempt.findMany({
    where: {
      userId: req.user.sub,
      ...(rangeStart ? { reviewedAt: { gte: rangeStart } } : {})
    },
    orderBy: { reviewedAt: "asc" }
  });

  const subjectStats = await prisma.subject.findMany({
    where: { userId: req.user.sub },
    include: {
      chapters: {
        include: {
          flashCards: {
            include: {
              reviewAttempts: rangeStart
                ? {
                    where: {
                      reviewedAt: { gte: rangeStart }
                    }
                  }
                : true
            }
          }
        }
      }
    }
  });

  const activityCountsByDate = new Map();
  const attemptCountsByDate = new Map();

  for (const entry of activities) {
    incrementCount(activityCountsByDate, formatLocalDateKey(entry.date), entry.cardsReviewed);
  }

  for (const attempt of attempts) {
    incrementCount(attemptCountsByDate, formatLocalDateKey(attempt.reviewedAt), 1);
  }

  const windowSize = range === "month" ? 30 : 7;
  const chartWindow = Array.from({ length: windowSize }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (windowSize - 1 - index));
    const key = formatLocalDateKey(date);
    const reviewed = getReviewedCount(key, activityCountsByDate, attemptCountsByDate);
    const attemptsForDay = attempts.filter((entry) => formatLocalDateKey(entry.reviewedAt) === key);

    return {
      label:
        range === "month"
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : date.toLocaleDateString("en-US", { weekday: "short" }),
      reviewed,
      accuracy:
        attemptsForDay.length === 0
          ? 0
          : Math.round(
              attemptsForDay.reduce((total, attempt) => total + attempt.aiScore, 0) / attemptsForDay.length
            )
    };
  });

  const allHeatmapDates = new Set([
    ...activityCountsByDate.keys(),
    ...attemptCountsByDate.keys()
  ]);

  const heatmap = Array.from(allHeatmapDates)
    .sort()
    .map((date) => {
      const reviewedCount = getReviewedCount(date, activityCountsByDate, attemptCountsByDate);
      return {
        date,
        count: reviewedCount,
        value: Math.min(4, reviewedCount)
      };
    });

  const subjectPerformance = subjectStats.map((subject) => {
    const attemptsForSubject = subject.chapters.flatMap((chapter) =>
      chapter.flashCards.flatMap((card) => card.reviewAttempts)
    );

    return {
      subject: subject.title,
      reviewed: attemptsForSubject.length,
      accuracy:
        attemptsForSubject.length === 0
          ? 0
          : Math.round(
              attemptsForSubject.reduce((total, attempt) => total + attempt.aiScore, 0) /
                attemptsForSubject.length
            )
    };
  });

  const difficultyBreakdown = attempts.reduce(
    (totals, attempt) => {
      const key = attempt.difficultyLabel.toLowerCase();
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    },
    { again: 0, hard: 0, medium: 0, easy: 0 }
  );

  const cardsReviewed = attempts.length;
  const avgAccuracy =
    attempts.length === 0
      ? 0
      : Math.round(attempts.reduce((total, attempt) => total + attempt.aiScore, 0) / attempts.length);
  const daysActive = heatmap.filter((entry) => entry.count > 0).length;
  const denominator = range === "all" ? Math.max(user?.totalStudyDays ?? daysActive, 1) : windowSize;
  const consistency = Math.round((daysActive / denominator) * 100);

  res.json({
    avgAccuracy,
    cardsReviewed,
    daysActive,
    consistency,
    currentStreak: user?.currentStreak ?? 0,
    maxStreak: user?.maxStreak ?? 0,
    maxActiveDays: user?.maxActiveDays ?? 0,
    totalStudyDays: user?.totalStudyDays ?? 0,
    heatmap,
    accuracyOverTime: chartWindow.map((entry) => ({
      label: entry.label,
      accuracy: entry.accuracy
    })),
    cardsPerDay: chartWindow.map((entry) => ({
      label: entry.label,
      reviewed: entry.reviewed
    })),
    subjectPerformance,
    difficultyBreakdown
  });
}

export async function profileStats(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub }
  });

  const subjectStats = await prisma.subject.findMany({
    where: { userId: req.user.sub },
    include: {
      chapters: {
        include: {
          flashCards: {
            include: {
              reviewAttempts: true
            }
          }
        }
      }
    }
  });

  const recentAttempts = await prisma.reviewAttempt.findMany({
    where: { userId: req.user.sub },
    orderBy: { reviewedAt: "desc" },
    take: 8,
    include: {
      flashCard: {
        include: {
          chapter: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  const subjectPerformance = subjectStats.map((subject) => {
    const attempts = subject.chapters.flatMap((chapter) =>
      chapter.flashCards.flatMap((card) => card.reviewAttempts)
    );
    const averageScore =
      attempts.length === 0
        ? 0
        : attempts.reduce((total, attempt) => total + attempt.aiScore, 0) / attempts.length;
    return { title: subject.title, averageScore };
  });

  const strongestSubject = [...subjectPerformance].sort((a, b) => b.averageScore - a.averageScore)[0];
  const weakestSubject = [...subjectPerformance].sort((a, b) => a.averageScore - b.averageScore)[0];

  const totalFlashcardsCreated = subjectStats.reduce(
    (total, subject) =>
      total + subject.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.flashCards.length, 0),
    0
  );

  const totalFlashcardsReviewed = subjectStats.reduce(
    (total, subject) =>
      total +
      subject.chapters.reduce(
        (chapterTotal, chapter) =>
          chapterTotal +
          chapter.flashCards.reduce((cardTotal, card) => cardTotal + card.reviewAttempts.length, 0),
        0
      ),
    0
  );

  const totalAccuracy =
    totalFlashcardsReviewed === 0
      ? 0
      : Math.round(
          subjectStats
            .flatMap((subject) => subject.chapters)
            .flatMap((chapter) => chapter.flashCards)
            .flatMap((card) => card.reviewAttempts)
            .reduce((total, attempt) => total + attempt.aiScore, 0) / totalFlashcardsReviewed
        );

  res.json({
    user: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      studyingSince: user?.createdAt ?? null
    },
    currentStreak: user?.currentStreak ?? 0,
    maxStreak: user?.maxStreak ?? 0,
    maxActiveDays: user?.maxActiveDays ?? 0,
    totalStudyDays: user?.totalStudyDays ?? 0,
    totalFlashcardsCreated,
    totalFlashcardsReviewed,
    avgAccuracy: totalAccuracy,
    strongestSubject: strongestSubject?.title ?? "N/A",
    weakestSubject: weakestSubject?.title ?? "N/A",
    recentActivity: recentAttempts.map((attempt) => ({
      id: attempt.id,
      reviewedAt: attempt.reviewedAt,
      question: attempt.flashCard.question,
      chapter: attempt.flashCard.chapter.title,
      subject: attempt.flashCard.chapter.subject.title,
      score: Math.round(attempt.aiScore),
      difficulty: attempt.difficultyLabel.toLowerCase()
    }))
  });
}
