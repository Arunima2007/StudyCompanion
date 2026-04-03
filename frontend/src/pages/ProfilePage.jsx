import { useQuery } from "@tanstack/react-query";
import Heatmap from "../components/Heatmap";
import { getProfileStats, getProgress } from "../lib/api";

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfileStats });
  const { data: heatmapData } = useQuery({ queryKey: ["profile-heatmap"], queryFn: () => getProgress("all") });

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
        <h2 className="text-2xl font-semibold">Yearly study heatmap</h2>
        <p className="mt-2 text-muted">Hover any cell to see how many cards you studied on that day.</p>
        <div className="mt-6">
          <Heatmap data={heatmapData.heatmap} />
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
