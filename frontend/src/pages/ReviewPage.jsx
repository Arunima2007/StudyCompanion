import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDueCards, rateReview, submitReview } from "../lib/api";

function inferDifficultyLabel(score) {
  if (score >= 80) {
    return "easy";
  }

  if (score >= 55) {
    return "medium";
  }

  return "hard";
}

export default function ReviewPage() {
  const location = useLocation();
  const subjectId = location.state?.subjectId;
  const chapterId = location.state?.chapterId;
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState([]);
  const [formError, setFormError] = useState("");

  const { data: cards = [], refetch } = useQuery({
    queryKey: ["review", subjectId, chapterId],
    queryFn: () => getDueCards({ subjectId, chapterId })
  });

  const currentCard = cards[index] ?? null;

  const submitMutation = useMutation({
    mutationFn: ({ flashCardId, userAnswer }) => submitReview(flashCardId, userAnswer),
    onSuccess: (data) => {
      setFormError("");
      setFeedback(data);
    },
    onError: (error) => {
      setFormError(error?.response?.data?.message ?? "Unable to submit your answer right now.");
    }
  });

  const rateMutation = useMutation({
    mutationFn: ({ flashCardId, payload }) => rateReview(flashCardId, payload),
    onSuccess: () => {
      setSummary((current) => [...current, { score: feedback?.score ?? 0 }]);
      setAnswer("");
      setFeedback(null);
      setFormError("");
      setIndex((current) => current + 1);
    },
    onError: (error) => {
      setFormError(error?.response?.data?.message ?? "Unable to save this review right now.");
    }
  });

  function handleSubmit() {
    if (!answer.trim()) {
      setFormError("Type an answer before submitting.");
      return;
    }

    submitMutation.mutate({ flashCardId: currentCard.id, userAnswer: answer.trim() });
  }

  const averageScore = useMemo(() => {
    if (!summary.length) {
      return 0;
    }
    return Math.round(summary.reduce((total, item) => total + item.score, 0) / summary.length);
  }, [summary]);

  if (!cards.length && !currentCard) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-card">
        <h1 className="text-3xl font-semibold">No cards to review right now</h1>
        <p className="mt-3 text-muted">Generate cards in your study room, then start a review session here.</p>
        <button type="button" onClick={() => refetch()} className="mt-6 rounded-full bg-brand px-5 py-3 font-medium text-white">Refresh</button>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-card">
        <h1 className="text-3xl font-semibold">Session complete</h1>
        <p className="mt-3 text-muted">You reviewed {summary.length} cards with an average AI score of {averageScore}%.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">Card {index + 1} of {cards.length}</div>
          <div className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">{currentCard.type}</div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-brand-mid">
          <div className="h-full rounded-full bg-brand" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold">{currentCard.question}</h1>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer..."
          disabled={submitMutation.isPending}
          className="mt-6 min-h-40 w-full rounded-[1.6rem] border border-brand-mid px-4 py-4 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        {formError ? <p className="mt-3 text-sm text-red-500">{formError}</p> : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="mt-4 inline-flex items-center gap-3 rounded-full bg-brand px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitMutation.isPending ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Reviewing with AI...
            </>
          ) : (
            "Submit Answer"
          )}
        </button>
      </div>

      {submitMutation.isPending ? (
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-mid border-t-brand" />
            <div>
              <h2 className="text-xl font-semibold">AI is reviewing your answer</h2>
              <p className="mt-1 text-sm text-muted">Please wait a moment while Flashr scores your response and prepares feedback.</p>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${feedback.score >= 80 ? "bg-green-100 text-green-700" : feedback.score >= 55 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            Score: {feedback.score}%
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.4rem] bg-brand-soft p-4">
              <div className="font-medium">Strengths</div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {feedback.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-[1.4rem] bg-brand-soft p-4">
              <div className="font-medium">Gaps</div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {feedback.gaps.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-[1.4rem] bg-white p-4 ring-1 ring-brand-mid">
            <div className="font-medium">Improved answer</div>
            <p className="mt-2 text-sm leading-7 text-muted">{feedback.improvedAnswer}</p>
          </div>
          <button
            type="button"
            disabled={rateMutation.isPending}
            onClick={() =>
              rateMutation.mutate({
                flashCardId: currentCard.id,
                payload: {
                  userAnswer: answer,
                  difficultyLabel: inferDifficultyLabel(feedback.score),
                  aiFeedback: feedback
                }
              })
            }
            className="mt-6 rounded-full bg-brand px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {rateMutation.isPending ? "Saving review..." : "Continue to next card"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
