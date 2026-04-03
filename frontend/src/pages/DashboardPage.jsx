import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboard } from "../lib/api";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });

  if (isLoading) {
    return <div className="rounded-[2rem] bg-white p-8 shadow-card">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.24em] text-brand">Dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold">Good morning, {data.user.name}</h1>
        <p className="mt-3 max-w-2xl text-muted">Review what is due today, open a subject, or jump straight into your next active recall session.</p>
        <Link to="/review" className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 font-medium text-white">Start studying</Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Cards due today", data.stats.dueToday],
          ["Current streak", data.stats.currentStreak],
          ["Total cards", data.stats.totalCards],
          ["Avg accuracy", `${data.stats.avgAccuracy}%`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.6rem] bg-white p-6 shadow-card">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Quick access</h2>
            <Link to="/study-room" className="text-sm font-medium text-brand">Open study room</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.subjects.map((subject) => (
              <div key={subject.id} className="rounded-[1.4rem] bg-brand-soft p-5">
                <div className="text-lg font-medium">{subject.title}</div>
                <div className="mt-3 flex justify-between text-sm text-muted">
                  <span>{subject.cards} cards</span>
                  <span>{subject.due} due</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Recent activity</h2>
          <div className="mt-6 space-y-4">
            {data.recentActivity.length === 0 ? <p className="text-muted">No recent activity yet.</p> : null}
            {data.recentActivity.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] bg-brand-soft p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{item.subject}</div>
                    <div className="text-sm text-muted">{item.chapter}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-brand">{item.score}%</div>
                    <div className="text-sm capitalize text-muted">{item.difficulty}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
