import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getProgress } from "../lib/api";

const ranges = [
  ["week", "This week"],
  ["month", "This month"],
  ["all", "All time"]
];

export default function ProgressPage() {
  const [range, setRange] = useState("week");
  const { data, isLoading } = useQuery({
    queryKey: ["progress", range],
    queryFn: () => getProgress(range)
  });

  if (isLoading) {
    return <div className="rounded-[2rem] bg-white p-8 shadow-card">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Progress</p>
            <h1 className="mt-3 text-4xl font-semibold">See your study data from every angle</h1>
          </div>
          <div className="flex gap-2 rounded-full bg-brand-soft p-2">
            {ranges.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setRange(value)} className={`rounded-full px-4 py-2 text-sm font-medium ${range === value ? "bg-brand text-white" : "text-muted"}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Avg accuracy", `${data.avgAccuracy}%`],
          ["Cards reviewed", data.cardsReviewed],
          ["Days active", data.daysActive],
          ["Consistency", `${data.consistency}%`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.6rem] bg-white p-6 shadow-card">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Accuracy over time</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.accuracyOverTime}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#6C5CE7" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Cards reviewed per day</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cardsPerDay}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reviewed" fill="#3BB6B6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-xl font-semibold">Performance by subject</h2>
          <div className="mt-6 space-y-4">
            {data.subjectPerformance.map((subject) => (
              <div key={subject.subject}>
                <div className="flex justify-between text-sm">
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
    </div>
  );
}
