import { Link, Navigate } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";

const features = [
  "Upload PDFs or paste lecture notes",
  "Generate intelligent flashcards with Gemini",
  "Write answers instead of just flipping cards",
  "Get AI evaluation and targeted feedback",
  "Schedule reviews with spaced repetition",
  "Track streaks, charts, and subject accuracy"
];

export default function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#faf9ff_0%,#f0eeff_45%,#ffffff_100%)] text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
        <div className="text-3xl font-semibold">Flashr</div>
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About Us</a>
        </nav>
        <div className="flex gap-3">
          <Link to="/login" className="rounded-full px-4 py-3 text-sm font-medium text-brand">Log in</Link>
          <Link to="/login" className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white shadow-card">Get Started Free</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:px-8 md:pt-20">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-brand ring-1 ring-brand-mid">
              AI study built for active recall
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-7xl">
              Turn lecture notes into a review flow that actually sticks.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Flashr helps students upload notes, generate high-quality flashcards, answer in their own words, and see exactly how their retention improves over time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/login" className="rounded-full bg-brand px-6 py-3 font-medium text-white shadow-card">Start studying</Link>
              <a href="#how" className="rounded-full border border-brand-mid bg-white px-6 py-3 font-medium text-ink">See how it works</a>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              {[
                ["6", "core features"],
                ["30 days", "secure login"],
                ["AI", "answer feedback"],
                ["52 weeks", "activity heatmap"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-[1.5rem] bg-white p-4 shadow-card">
                  <div className="text-2xl font-semibold text-brand">{value}</div>
                  <div className="mt-2 text-sm text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="rounded-[2rem] bg-white p-6 shadow-card">
            <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#6C5CE7_0%,#8D82F8_100%)] p-6 text-white">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Flashcard Preview</p>
              <h2 className="mt-3 text-3xl font-semibold">Explain the role of mitochondria in ATP production.</h2>
              <p className="mt-4 text-white/85">Write your answer, submit it to AI review, then rate the card based on difficulty.</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {["Biology", "Economics", "Physics", "History"].map((subject) => (
                <div key={subject} className="rounded-[1.4rem] bg-brand-soft p-4">
                  <div className="text-sm text-muted">{subject}</div>
                  <div className="mt-2 text-lg font-medium">{Math.floor(Math.random() * 12) + 6} cards due</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <Reveal><h2 className="text-4xl font-semibold">Features</h2></Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Reveal key={feature}>
              <div className="rounded-[1.8rem] bg-white p-6 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-xl text-brand">✦</div>
                <p className="mt-5 text-lg font-medium">{feature}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <Reveal><h2 className="text-4xl font-semibold">How it works</h2></Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {["Create subjects", "Add chapters", "Upload and generate", "Review and improve"].map((step, index) => (
            <Reveal key={step}>
              <div className="rounded-[1.8rem] bg-white p-6 shadow-card">
                <div className="text-sm uppercase tracking-[0.24em] text-brand">Step {index + 1}</div>
                <p className="mt-4 text-xl font-medium">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <Reveal>
          <div className="rounded-[2rem] bg-white p-8 shadow-card">
            <h2 className="text-4xl font-semibold">About Us</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
              Flashr exists to make studying more active, less overwhelming, and easier to sustain. We blend AI guidance with progress tracking so students can focus on learning, not setup.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Retention first", "Clean workflow", "Progress with context"].map((pill) => (
                <span key={pill} className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand">{pill}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <Reveal>
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6C5CE7_0%,#8D82F8_100%)] p-10 text-white shadow-card">
            <h2 className="text-4xl font-semibold">Ready to build your next study streak?</h2>
            <p className="mt-4 max-w-2xl text-lg text-white/85">Sign in with Google, upload your notes, and start revising smarter.</p>
            <Link to="/login" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-medium text-brand">Get Started Free</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
