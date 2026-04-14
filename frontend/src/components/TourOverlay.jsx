import { useState } from "react";

const steps = [
  "Welcome to Flashr. Your dashboard shows your generated cards and study progress.",
  "This is your Study Room, where you create subjects.",
  "Inside each subject, add chapters for each lecture topic.",
  "Upload notes, set review time, and generate flashcards.",
  "Track progress, streaks, and consistency over time."
];

export default function TourOverlay({ onSkip, onFinish }) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-ink/65 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Welcome Tour</p>
            <button type="button" onClick={onSkip} className="text-sm text-muted">Skip</button>
          </div>
          <h2 className="mt-4 text-3xl font-semibold">Step {step + 1}</h2>
          <p className="mt-4 text-lg leading-8 text-muted">{steps[step]}</p>
          <div className="mt-6 flex gap-2">
            {steps.map((item, index) => (
              <div key={item} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-brand" : "bg-brand-mid"}`} />
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((current) => current + 1)} className="rounded-full bg-brand px-5 py-3 font-medium text-white">Next</button>
            ) : (
              <button type="button" onClick={onFinish} className="rounded-full bg-brand px-5 py-3 font-medium text-white">Finish</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
