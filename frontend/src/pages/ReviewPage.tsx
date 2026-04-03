import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/Button";
import { getDueCards, rateReview, submitReview } from "../lib/api";

export function ReviewPage() {
  const queryClient = useQueryClient();
  const {
    data: reviewCards = [],
    isLoading,
    error
  } = useQuery({ queryKey: ["due-cards"], queryFn: () => getDueCards() });
  const reviewMutation = useMutation({
    mutationFn: ({
      flashCardId,
      userAnswer
    }: {
      flashCardId: string;
      userAnswer: string;
    }) => submitReview(flashCardId, { userAnswer })
  });
  const ratingMutation = useMutation({
    mutationFn: ({
      flashCardId,
      userAnswer,
      difficultyLabel,
      aiFeedback
    }: {
      flashCardId: string;
      userAnswer: string;
      difficultyLabel: "easy" | "medium" | "hard";
      aiFeedback: any;
    }) => rateReview(flashCardId, { userAnswer, difficultyLabel, aiFeedback }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["due-cards"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    }
  });
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const currentCard = reviewCards[0];

  if (isLoading) {
    return (
      <div className="rounded-[32px] bg-white p-8 shadow-soft">
        <h1 className="font-display text-4xl text-ink">Loading due cards...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] bg-white p-8 shadow-soft">
        <h1 className="font-display text-4xl text-ink">Could not load review cards</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          {error instanceof Error ? error.message : "Unknown review error."}
        </p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="rounded-[32px] bg-white p-8 shadow-soft">
        <h1 className="font-display text-4xl text-ink">No review cards due right now</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Generate a new chapter from the study room or come back after more cards are scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <div className="inline-flex rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
          {currentCard.type}
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          {reviewCards.length} due card{reviewCards.length === 1 ? "" : "s"} available
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">{currentCard.question}</h1>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Your answer
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="mt-2 min-h-48 w-full rounded-[24px] border border-slate-200 px-4 py-4 outline-none transition focus:border-teal"
            placeholder="Type your answer before asking AI for feedback..."
          />
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={async () => {
              if (!answer.trim()) {
                setErrorMessage("Type an answer before asking AI to review it.");
                return;
              }

              try {
                setIsReviewing(true);
                setErrorMessage("");
                const result = await reviewMutation.mutateAsync({
                  flashCardId: currentCard.id,
                  userAnswer: answer.trim()
                });
                setFeedback({ ...result.feedback, userAnswer: answer.trim() });
                setSubmitted(true);
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "AI review failed.");
              } finally {
                setIsReviewing(false);
              }
            }}
          >
            {isReviewing ? "Analyzing..." : "Submit for AI feedback"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              queryClient.setQueryData(["due-cards"], (current: typeof reviewCards | undefined) =>
                current && current.length > 1 ? [...current.slice(1), current[0]] : current
              );
              setAnswer("");
              setSubmitted(false);
              setFeedback(null);
            }}
          >
            Skip card
          </Button>
        </div>
      </section>

      <section className="rounded-[32px] bg-ink p-6 text-white shadow-soft">
        <h2 className="font-display text-3xl">AI Review</h2>
        {errorMessage ? (
          <div className="mt-4 rounded-2xl bg-rose-400/20 p-4 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}
        {feedback?.debug ? (
          <div className="mt-4 rounded-2xl bg-amber-400/20 p-4 text-sm text-amber-100">
            Source: {feedback.debug.source}. {feedback.debug.reason}
          </div>
        ) : null}
        {!submitted ? (
          <p className="mt-4 leading-7 text-white/75">
            After submission, the AI will score the answer, point out strengths,
            show missing ideas, and help schedule the next review.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Score</p>
              <p className="mt-2 text-3xl font-bold">{feedback?.score ?? 0} / 100</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white/80">
              <p className="font-semibold text-white">Recommended difficulty</p>
              <p className="mt-2 capitalize">
                {feedback?.suggestedDifficulty ?? "medium"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white/80">
              <p className="font-semibold text-white">Strengths</p>
              <p className="mt-2">{feedback?.strengths?.join(" ")}</p>
              <p className="mt-4 font-semibold text-white">Gaps</p>
              <p className="mt-2">{feedback?.gaps?.join(" ")}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white/80">
              <p className="font-semibold text-white">Your answer</p>
              <p className="mt-2">{feedback?.userAnswer ?? answer}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white/80">
              Improved answer: {feedback?.improvedAnswer ?? currentCard.answer}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="min-w-[140px]"
                onClick={async () => {
                  await ratingMutation.mutateAsync({
                    flashCardId: currentCard.id,
                    userAnswer: feedback?.userAnswer ?? answer,
                    difficultyLabel: "easy",
                    aiFeedback: feedback
                  });
                  setAnswer("");
                  setSubmitted(false);
                  setFeedback(null);
                }}
              >
                Mark easy
              </Button>
              <Button
                variant="secondary"
                className="min-w-[140px]"
                onClick={async () => {
                  await ratingMutation.mutateAsync({
                    flashCardId: currentCard.id,
                    userAnswer: feedback?.userAnswer ?? answer,
                    difficultyLabel: "medium",
                    aiFeedback: feedback
                  });
                  setAnswer("");
                  setSubmitted(false);
                  setFeedback(null);
                }}
              >
                Mark medium
              </Button>
              <Button
                variant="secondary"
                className="min-w-[140px]"
                onClick={async () => {
                  try {
                    setErrorMessage("");
                    await ratingMutation.mutateAsync({
                      flashCardId: currentCard.id,
                      userAnswer: feedback?.userAnswer ?? answer,
                      difficultyLabel: "hard",
                      aiFeedback: feedback
                    });
                    setAnswer("");
                    setSubmitted(false);
                    setFeedback(null);
                  } catch (error) {
                    setErrorMessage(
                      error instanceof Error ? error.message : "Could not save the hard review."
                    );
                  }
                }}
              >
                Mark hard
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
