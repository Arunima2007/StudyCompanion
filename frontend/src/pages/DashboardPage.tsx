import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getProgressOverview, getSubjects } from "../lib/api";
import { OnboardingTour } from "../components/OnboardingTour";
import { StatCard } from "../components/StatCard";
import { SubjectCard } from "../components/SubjectCard";
import { Button } from "../components/Button";
import { useAuth } from "../state/auth";
import { Reveal } from "../components/Reveal";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, finishOnboarding } = useAuth();
  const [tourStep, setTourStep] = useState(0);
  const [tourOpen, setTourOpen] = useState(!user?.hasCompletedOnboarding);
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: progress } = useQuery({
    queryKey: ["progress-overview"],
    queryFn: getProgressOverview
  });

  const dashboardStats = [
    {
      label: "Cards Due Today",
      value: String(subjects.reduce((total, subject) => total + subject.cardsDue, 0)),
      tone: "bg-coral/15 text-coral"
    },
    {
      label: "Current Streak",
      value: `${progress?.currentStreak ?? 0} days`,
      tone: "bg-teal/15 text-teal"
    },
    {
      label: "Max Streak",
      value: `${progress?.maxStreak ?? 0} days`,
      tone: "bg-amber-100 text-amber-700"
    },
    {
      label: "Study Days",
      value: String(progress?.totalStudyDays ?? 0),
      tone: "bg-sky-100 text-sky-700"
    }
  ];

  const closeTour = () => {
    finishOnboarding();
    setTourOpen(false);
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <Reveal direction="left">
          <div className="rounded-[32px] bg-ink p-8 text-white shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)]">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            Dashboard
          </div>
          <h1 className="mt-4 font-display text-5xl font-bold">
            Welcome back, {user?.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/75">
            Your next best move is already waiting: review due cards, create a
            new subject, or upload fresh notes for the next chapter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/study-room")}>Open study room</Button>
            <Button variant="secondary" onClick={() => setTourOpen(true)}>
              Replay tour
            </Button>
          </div>
          </div>
        </Reveal>
        <Reveal delay={120} direction="right">
          <div className="rounded-[32px] bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(148,163,184,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal">
            AI Feedback Snapshot
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Strong conceptual recall in Biology, but your answers can be tighter.",
              "History reviews are consistent, but hard cards need another pass tomorrow.",
              "Network protocol answers improved 12% this week."
            ].map((item, index) => (
              <Reveal key={item} delay={140 + index * 80}>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600 transition duration-300 hover:translate-x-1 hover:bg-white">
                {item}
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 70}>
            <StatCard {...stat} />
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="rounded-[32px] bg-white p-6 shadow-soft transition duration-300 hover:shadow-[0_24px_48px_rgba(148,163,184,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              My Study Room
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">Your active subjects</h2>
          </div>
          <Button onClick={() => navigate("/study-room")}>Create subject</Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {subjects.map((subject, index) => (
            <Reveal key={subject.id} delay={index * 80}>
              <SubjectCard
                subject={subject}
                onOpen={() => navigate(`/study-room/${subject.id}`)}
              />
            </Reveal>
          ))}
        </div>
        </section>
      </Reveal>

      <OnboardingTour
        open={tourOpen}
        step={tourStep}
        onNext={() => setTourStep((step) => Math.min(step + 1, 3))}
        onClose={closeTour}
      />
    </div>
  );
}
