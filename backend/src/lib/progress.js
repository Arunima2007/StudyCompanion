import { prisma } from "./prisma.js";

function sameUtcDay(left, right) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

export async function recomputeUserProgress(userId) {
  const activities = await prisma.dailyActivity.findMany({
    where: { userId },
    orderBy: { date: "asc" }
  });

  let totalStudyDays = activities.length;
  let currentStreak = 0;
  let maxStreak = 0;
  let runningStreak = 0;
  let lastDate = null;

  for (const activity of activities) {
    const activityDate = new Date(activity.date);

    if (!lastDate) {
      runningStreak = 1;
    } else {
      const previous = new Date(lastDate);
      const expectedNext = new Date(previous);
      expectedNext.setUTCDate(expectedNext.getUTCDate() + 1);
      runningStreak = sameUtcDay(activityDate, expectedNext) ? runningStreak + 1 : 1;
    }

    maxStreak = Math.max(maxStreak, runningStreak);
    lastDate = activityDate;
  }

  if (lastDate) {
    const today = new Date();
    const previousDay = new Date(today);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);

    if (sameUtcDay(lastDate, today) || sameUtcDay(lastDate, previousDay)) {
      currentStreak = runningStreak;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      maxStreak,
      totalStudyDays,
      maxActiveDays: maxStreak
    }
  });
}
