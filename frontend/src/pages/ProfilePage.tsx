import { useQuery } from "@tanstack/react-query";
import { Heatmap } from "../components/Heatmap";
import { getProfileStats, getProgressOverview } from "../lib/api";

export function ProfilePage() {
  const { data: profile } = useQuery({ queryKey: ["profile-stats"], queryFn: getProfileStats });
  const { data: progress } = useQuery({ queryKey: ["progress-overview"], queryFn: getProgressOverview });

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <div className="min-w-0 rounded-[32px] bg-ink p-6 text-white shadow-soft">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 font-display text-2xl">
            {profile?.user.name?.[0] ?? "A"}
          </div>
          <h1 className="mt-5 font-display text-4xl">{profile?.user.name ?? "Learner"}</h1>
          <p className="mt-2 text-white/70">Focused learner building consistency one session at a time.</p>
          <div className="mt-6 space-y-3 text-sm text-white/80">
            <p>Strongest subject: {profile?.strongestSubject ?? "N/A"}</p>
            <p>Needs attention: {profile?.weakestSubject ?? "N/A"}</p>
            <p>Email: {profile?.user.email ?? "N/A"}</p>
          </div>
        </div>
        <div className="min-w-0 overflow-visible rounded-[32px] bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink">Activity Map</h2>
              <p className="mt-2 text-sm text-slate-500">LeetCode-style profile heatmap for daily learning momentum.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <p>
                Total active days:{" "}
                <span className="font-semibold text-ink">{profile?.totalStudyDays ?? 0}</span>
              </p>
              <p>
                Max streak:{" "}
                <span className="font-semibold text-ink">{profile?.maxStreak ?? 0}</span>
              </p>
              <p>
                Current streak:{" "}
                <span className="font-semibold text-ink">{profile?.currentStreak ?? 0}</span>
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Heatmap data={progress?.heatmap ?? []} />
          </div>
        </div>
      </section>
    </div>
  );
}
