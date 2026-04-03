import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getProgressOverview } from "../lib/api";

export function ProgressPage() {
  const { data } = useQuery({ queryKey: ["progress-overview"], queryFn: getProgressOverview });
  const weeklyProgress = data?.weeklyProgress ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Progress</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Consistency makes recall easier.</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Track daily activity, retention quality, and how often your harder cards return.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink">Cards Reviewed</h2>
          <p className="mt-2 text-sm text-slate-500">
            Number of cards you actively reviewed each day this week.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="reviewed" fill="#2563eb" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink">Accuracy</h2>
          <p className="mt-2 text-sm text-slate-500">
            Average AI score for your reviewed answers across the last 7 days.
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgress}>
                <defs>
                  <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke="none"
                  fill="url(#accuracyFill)"
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ fill: "#0f172a", r: 4 }}
                  activeDot={{ r: 6, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <h2 className="font-display text-2xl text-ink">Retention Trend</h2>
        <p className="mt-2 text-sm text-slate-500">
          Longer-term score trend showing how your answers are improving over time.
        </p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyProgress}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" />
              <YAxis domain={[50, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
              <Line
                type="monotone"
                dataKey="retention"
                stroke="#c27b48"
                strokeWidth={3}
                dot={{ fill: "#c27b48", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
