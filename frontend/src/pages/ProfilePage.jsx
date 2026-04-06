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

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfileStats });
  const { data: heatmapData } = useQuery({ queryKey: ["profile-heatmap"], queryFn: () => getProgress("all") });
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
        <h2 className="text-2xl font-semibold">Subject breakdown</h2>
        <div className="mt-6 space-y-4">
          {profile.subjectBreakdown.map((subject) => (
            <div key={subject.subject}>
              <div className="flex items-center justify-between">
                <span>{subject.subject}</span>
                <span>{subject.accuracy}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-brand-mid">
                <div className="h-full rounded-full bg-brand" style={{ width: `${subject.accuracy}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
