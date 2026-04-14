import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Heatmap from "../components/Heatmap";
import { getProfileStats, getProgress } from "../lib/api";

function getYearMetrics(entries, year) {
  const yearEntries = entries
    .filter((item) => new Date(item.date).getFullYear() === year && item.count > 0)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate = null;

  for (const entry of yearEntries) {
    const currentDate = new Date(entry.date);

    if (!previousDate) {
      currentStreak = 1;
    } else {
      const diffInDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
      currentStreak = diffInDays === 1 ? currentStreak + 1 : 1;
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    previousDate = currentDate;
  }

  return {
    cardsStudied: yearEntries.reduce((total, entry) => total + entry.count, 0),
    activeDays: yearEntries.length,
    maxStreak
  };
}

function formatRelativeTime(input) {
  const date = new Date(input);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfileStats });
  const { data: heatmapData } = useQuery({ queryKey: ["profile-heatmap"], queryFn: () => getProgress("all") });
  const recentActivity = profile?.recentActivity ?? [];
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear]);

    for (const item of heatmapData?.heatmap ?? []) {
      years.add(new Date(item.date).getFullYear());
    }

    return [...years].sort((left, right) => right - left);
  }, [heatmapData]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const selectedYearMetrics = useMemo(
    () => getYearMetrics(heatmapData?.heatmap ?? [], selectedYear),
    [heatmapData, selectedYear]
  );

  if (isLoading || !heatmapData) {
    return <div className="rounded-[2rem] bg-white p-8 shadow-card">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-3xl font-semibold text-white">
            {profile.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-semibold">{profile.user.name}</h1>
            <p className="mt-2 text-muted">{profile.user.email}</p>
            <p className="mt-2 text-sm text-muted">Studying since {profile.user.studyingSince ? new Date(profile.user.studyingSince).toLocaleDateString() : "today"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Current streak", profile.currentStreak],
          ["Max streak", profile.maxStreak],
          ["Max active days", profile.maxActiveDays],
          ["Total cards done", profile.totalFlashcardsReviewed],
          ["Avg accuracy", `${profile.avgAccuracy}%`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.6rem] bg-white p-6 shadow-card">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Yearly study heatmap</h2>
            <p className="mt-2 text-muted">Hover any cell to see how many cards you studied on that day.</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-full bg-brand-soft p-2">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedYear === year ? "bg-brand text-white" : "text-muted"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-medium text-ink">
            {selectedYearMetrics.cardsStudied} cards studied in {selectedYear}
          </div>
          <div className="flex flex-wrap gap-6">
            <span>
              Total active days: <span className="font-semibold text-ink">{selectedYearMetrics.activeDays}</span>
            </span>
            <span>
              Max streak: <span className="font-semibold text-ink">{selectedYearMetrics.maxStreak}</span>
            </span>
          </div>
        </div>
        <div className="mt-6">
          <Heatmap data={heatmapData.heatmap} year={selectedYear} />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Recent activity</h2>
            <p className="mt-2 text-sm text-muted">Latest flashcards you reviewed, similar to a recent submissions feed.</p>
          </div>
          <div className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand">
            {recentActivity.length} recent reviews
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {recentActivity.length ? (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="rounded-[1.5rem] border border-brand-mid bg-brand-soft/60 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-base font-semibold text-ink">
                      {activity.question}
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      {activity.subject} • {activity.chapter}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium text-ink">{formatRelativeTime(activity.reviewedAt)}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                      AI score • {activity.score}%
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-brand-mid bg-brand-soft p-5 text-sm text-muted">
              No review activity yet. Start a study session and your recent reviewed questions will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
