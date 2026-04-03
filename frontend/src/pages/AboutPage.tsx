import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { AmbientGlow } from "../components/AmbientGlow";
import { Reveal } from "../components/Reveal";

export function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sand">
      <AmbientGlow />
      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Link to="/" className="text-sm font-semibold text-teal">
          Back to home
        </Link>
        <div className="mt-10 grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
          <Reveal direction="left">
            <section className="rounded-[32px] bg-ink p-8 text-white shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(17,24,39,0.14)]">
            <p className="text-sm uppercase tracking-[0.3em] text-white/55">About Us</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
              Built for learners who want understanding, not just exposure.
            </h1>
            <p className="mt-5 text-base leading-8 text-white/80">
              RecallFlow helps students turn passive notes into active recall,
              feedback-driven review, and visible long-term consistency.
            </p>
            <div className="mt-8">
              <Link to="/signup">
                <Button>Create your account</Button>
              </Link>
            </div>
            </section>
          </Reveal>
          <section className="space-y-5">
            {[
              {
                title: "Why it exists",
                body:
                  "Most note-taking tools stop at storage. This project helps learners practice, get evaluated, and revisit the right ideas at the right time."
              },
              {
                title: "Who it serves",
                body:
                  "Students, exam-prep learners, and self-taught builders who want AI to support retention instead of replacing thinking."
              },
              {
                title: "What matters",
                body:
                  "Clear study structures, guided onboarding, encouraging feedback, and progress signals like streaks, heatmaps, and subject growth."
              }
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 90} direction="right">
                <article className="rounded-[28px] bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(148,163,184,0.18)]">
                <h2 className="font-display text-2xl text-ink">{item.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
