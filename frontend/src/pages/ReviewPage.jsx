import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDueCards, rateReview, submitReview } from "../lib/api";

const ratings = [
  ["again", "Again", "bg-red-500"],
  ["hard", "Hard", "bg-orange-500"],
  ["medium", "Medium", "bg-yellow-500"],
  ["easy", "Easy", "bg-green-500"]
];

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
        <h1 className="text-3xl font-semibold">No cards due right now</h1>
        <p className="mt-3 text-muted">Generate cards in your study room or come back after the next scheduled review.</p>
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
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer..." className="mt-6 min-h-40 w-full rounded-[1.6rem] border border-brand-mid px-4 py-4 outline-none" />
        {formError ? <p className="mt-3 text-sm text-red-500">{formError}</p> : null}
        <button type="button" onClick={handleSubmit} className="mt-4 rounded-full bg-brand px-5 py-3 font-medium text-white">Submit Answer</button>
      </div>

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
          <div className="mt-6 flex flex-wrap gap-3">
            {ratings.map(([value, label, className]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  rateMutation.mutate({
                    flashCardId: currentCard.id,
                    payload: {
                      userAnswer: answer,
                      difficultyLabel: value,
                      aiFeedback: feedback
                    }
                  })
                }
                className={`rounded-full px-5 py-3 font-medium text-white ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
