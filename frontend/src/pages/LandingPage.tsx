import { Link, Navigate } from "react-router-dom";
import { Button } from "../components/Button";
import { dashboardStats, subjects } from "../data/mock";
import { StatCard } from "../components/StatCard";
import { SubjectCard } from "../components/SubjectCard";
import { useAuth } from "../state/auth";
import { Reveal } from "../components/Reveal";
import { AmbientGlow } from "../components/AmbientGlow";

export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.09),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)]">
      <AmbientGlow />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
        <div className="font-display text-3xl font-bold text-ink">RecallFlow</div>
        <div className="flex gap-3">
          <Link to="/about" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600">
            About Us
          </Link>
          <Link to="/login">
            <Button>Continue with Google</Button>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pt-16">
        <div>
          <Reveal delay={40}>
            <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-teal ring-1 ring-teal/15 backdrop-blur">
            AI flash cards with feedback, repetition, and real progress
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-tight text-ink md:text-7xl">
            Turn notes into practice sessions that actually stick.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Upload notes, generate question-based flash cards, type your answer,
            and let AI coach you with feedback before the card returns at the right time.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button>Continue with Google</Button>
            </Link>
            <Link to="/about">
              <Button variant="secondary">See how it works</Button>
            </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {dashboardStats.map((stat) => (
              <Reveal key={stat.label} delay={340 + dashboardStats.findIndex((item) => item.label === stat.label) * 90}>
                <StatCard {...stat} />
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={180} direction="right">
          <div className="rounded-[36px] bg-white/80 p-4 shadow-soft backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(17,24,39,0.12)]">
          <div className="rounded-[28px] bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-white/60">Study Flow</p>
            <div className="mt-5 space-y-4">
              {[
                "Upload notes or paste chapter content",
                "Set review time and generate flash cards",
                "Type your answer instead of flipping a card",
                "Receive AI feedback and adaptive scheduling"
              ].map((item, index) => (
                <Reveal key={item} delay={260 + index * 90}>
                  <div className="flex gap-4 rounded-2xl bg-white/10 p-4 transition duration-300 hover:translate-x-1 hover:bg-white/15">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral font-bold text-white">
                    0{index + 1}
                  </div>
                  <p className="pt-2 text-sm text-white/90">{item}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {subjects.slice(0, 2).map((subject) => (
              <Reveal key={subject.id} delay={520 + subjects.slice(0, 2).findIndex((item) => item.id === subject.id) * 100}>
                <SubjectCard subject={subject} />
              </Reveal>
            ))}
          </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
