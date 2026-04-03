import { Button } from "./Button";

const steps = [
  "This dashboard is your home base for due reviews, streaks, and quick actions.",
  "My Study Room is where you create subjects, chapters, and upload notes.",
  "Progress shows your review heatmap, retention trend, and upcoming cards.",
  "Your profile tracks streak, max active days, and long-term learning consistency."
];

type Props = {
  open: boolean;
  step: number;
  onNext: () => void;
  onClose: () => void;
};

export function OnboardingTour({ open, step, onNext, onClose }: Props) {
  if (!open) {
    return null;
  }

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 md:items-center">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-soft">
        <div className="inline-flex rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
          Guided Tour {step + 1}/{steps.length}
        </div>
        <h3 className="mt-4 font-display text-3xl text-ink">Welcome to your learning space</h3>
        <p className="mt-3 text-base leading-7 text-slate-600">{steps[step]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={isLast ? onClose : onNext}>
            {isLast ? "Finish Tour" : "Next Step"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}

