import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { AiFeedback, Subject } from "../types";
import { Button } from "../components/Button";
import {
  createChapter,
  createSubject,
  generateFlashcards,
  getDueCards,
  getSubjects,
  rateReview,
  submitReview,
  uploadNotes
} from "../lib/api";
import { extractTextFromPdf } from "../lib/aiService";

function deriveChapterTitleFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const noisyPattern =
    /^(experiment|exp|ost|assignment|file|document|notes?|arunima|mohan)+/i;
  const cleaned = normalized.replace(noisyPattern, "").trim();

  return cleaned || "Imported Chapter";
}

function normalizeChapterTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function mergeChapterItems(subject: Subject | undefined) {
  const chapterItems = subject?.chapterItems ?? [];
  const grouped = new Map<
    string,
    {
      id: string;
      title: string;
      description?: string;
      notesCount: number;
      flashcardsCount: number;
    }
  >();

  for (const chapter of chapterItems) {
    const key = normalizeChapterTitle(chapter.title);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...chapter });
      continue;
    }

    grouped.set(key, {
      ...existing,
      notesCount: existing.notesCount + chapter.notesCount,
      flashcardsCount: existing.flashcardsCount + chapter.flashcardsCount
    });
  }

  return Array.from(grouped.values());
}

function SubjectDirectory({
  subjects,
  newSubjectTitle,
  setNewSubjectTitle,
  handleCreateSubject,
  message,
  onOpenSubject
}: {
  subjects: Subject[];
  newSubjectTitle: string;
  setNewSubjectTitle: (value: string) => void;
  handleCreateSubject: () => void;
  message: string;
  onOpenSubject: (subjectId: string) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
              My Study Room
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink">Choose a subject to enter its study page</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Each subject opens its own workspace with only that subject&apos;s chapters, due cards, and review flow.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-3">
              <input
                className="min-w-56 rounded-full border border-slate-200 px-4 py-3 outline-none transition focus:border-teal"
                value={newSubjectTitle}
                onChange={(event) => setNewSubjectTitle(event.target.value)}
                placeholder="New subject name"
              />
              <Button onClick={handleCreateSubject}>Create subject</Button>
            </div>
            {message ? <p className="text-right text-sm font-medium text-slate-500">{message}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              Subjects
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">Open a subject page</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {subjects.length} subject{subjects.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => onOpenSubject(subject.id)}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal/40 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl text-ink">{subject.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{subject.chapters} chapters</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {subject.cardsDue} due
                </span>
              </div>
              <p className="mt-6 text-sm font-semibold text-teal">Open {subject.title} study page</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubjectWorkspace({
  subject,
  mergedChapterItems,
  dueCards,
  dueCardsLoading,
  chapterTitle,
  setChapterTitle,
  notes,
  setNotes,
  reviewTime,
  setReviewTime,
  selectedFileName,
  message,
  isGenerating,
  isParsingPdf,
  notesFileInputRef,
  pdfFileInputRef,
  onImportNotesClick,
  onUploadPdfClick,
  onImportNotesChange,
  onUploadPdfChange,
  onGenerate,
  currentCard,
  setCurrentReviewCardId,
  answer,
  setAnswer,
  submitted,
  feedback,
  reviewError,
  reviewPending,
  ratingPending,
  onSubmitReview,
  onSkipCard,
  onRateCard
}: {
  subject: Subject;
  mergedChapterItems: Array<{
    id: string;
    title: string;
    description?: string;
    notesCount: number;
    flashcardsCount: number;
  }>;
  dueCards: Awaited<ReturnType<typeof getDueCards>>;
  dueCardsLoading: boolean;
  chapterTitle: string;
  setChapterTitle: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  reviewTime: string;
  setReviewTime: (value: string) => void;
  selectedFileName: string;
  message: string;
  isGenerating: boolean;
  isParsingPdf: boolean;
  notesFileInputRef: React.RefObject<HTMLInputElement | null>;
  pdfFileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportNotesClick: () => void;
  onUploadPdfClick: () => void;
  onImportNotesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadPdfChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  currentCard: (Awaited<ReturnType<typeof getDueCards>>)[number] | null;
  setCurrentReviewCardId: (value: string) => void;
  answer: string;
  setAnswer: (value: string) => void;
  submitted: boolean;
  feedback: AiFeedback | null;
  reviewError: string;
  reviewPending: boolean;
  ratingPending: boolean;
  onSubmitReview: () => void;
  onSkipCard: () => void;
  onRateCard: (difficultyLabel: "easy" | "medium" | "hard") => void;
}) {
  const mergedDueCardsCount = mergedChapterItems.reduce(
    (total, chapter) => total + chapter.flashcardsCount,
    0
  );

  return (
    <div className="space-y-8">
      <input
        ref={notesFileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept=".txt,.md,.csv,.json,text/plain,text/markdown,application/json"
        className="hidden"
        onChange={onImportNotesChange}
      />
      <input
        ref={pdfFileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onUploadPdfChange}
      />

      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/study-room" className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
              Back to subjects
            </Link>
            <h1 className="mt-3 font-display text-5xl text-ink">{subject.title} Study Room</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Review only {subject.title} cards here, upload notes into this subject, and track just this subject&apos;s chapters.
            </p>
          </div>
          <div className="rounded-[28px] bg-slate-50 px-5 py-4 text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Subject Snapshot</p>
            <p className="mt-2 text-2xl font-bold text-ink">{mergedDueCardsCount} due cards</p>
            <p className="mt-1 text-sm text-slate-500">{mergedChapterItems.length} chapters</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
                  Chapters
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">{subject.title}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {mergedChapterItems.length} chapter{mergedChapterItems.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {mergedChapterItems.length ? (
                mergedChapterItems.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="rounded-2xl border border-slate-100 p-4 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-ink">{chapter.title}</p>
                    <p className="mt-1">
                      {chapter.notesCount} note{chapter.notesCount === 1 ? "" : "s"} and{" "}
                      {chapter.flashcardsCount} due card{chapter.flashcardsCount === 1 ? "" : "s"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  No chapters yet for this subject. Add notes below to create the first one.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
                  Due Cards
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">Review {subject.title}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {dueCardsLoading ? "Loading..." : `${dueCards.length} cards`}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {dueCardsLoading ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Loading {subject.title} due cards...
                </div>
              ) : dueCards.length ? (
                dueCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setCurrentReviewCardId(card.id)}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      currentCard?.id === card.id
                        ? "border-coral bg-coral/5"
                        : "border-slate-100 hover:border-slate-200"
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                        {card.type}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{card.chapterTitle}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink">{card.question}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  No due cards for {subject.title} yet. Generate flashcards below and they will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] bg-ink p-6 text-white shadow-soft">
            <h2 className="font-display text-3xl">Add Notes to {subject.title}</h2>
            <p className="mt-2 text-sm text-white/65">
              New cards will be created only inside {subject.title}.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-white/85">
                Chapter title
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none"
                  placeholder="Cell Division"
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-white/85">
                Paste notes
                <textarea
                  className="mt-2 min-h-40 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none"
                  placeholder="Paste notes or extracted text here..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold text-white/85">
                Review time needed
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none"
                  placeholder="20 minutes"
                  value={reviewTime}
                  onChange={(event) => setReviewTime(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button onClick={onGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate flash cards"}
                </Button>
                <Button variant="secondary" onClick={onImportNotesClick}>
                  Import notes
                </Button>
                <Button variant="secondary" disabled={isParsingPdf} onClick={onUploadPdfClick}>
                  {isParsingPdf ? "Extracting..." : "Upload PDF"}
                </Button>
              </div>
              {selectedFileName ? (
                <p className="text-sm font-medium text-white/65">Selected file: {selectedFileName}</p>
              ) : null}
              {message ? <p className="text-sm font-medium text-white/65">{message}</p> : null}
            </div>
          </div>

          <section className="rounded-[32px] bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
                  Review Panel
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">
                  {currentCard ? currentCard.chapterTitle : `${subject.title} review`}
                </h2>
              </div>
              {currentCard ? (
                <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
                  {currentCard.type}
                </span>
              ) : null}
            </div>

            {!currentCard ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                Choose one of {subject.title}&apos;s due cards from the left to start reviewing it.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-ink">{currentCard.question}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Subject: {subject.title} · Chapter: {currentCard.chapterTitle}
                  </p>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Your answer
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="mt-2 min-h-40 w-full rounded-[24px] border border-slate-200 px-4 py-4 outline-none transition focus:border-teal"
                    placeholder={`Type your ${subject.title} answer before asking AI for feedback...`}
                  />
                </label>

                {reviewError ? (
                  <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                    {reviewError}
                  </div>
                ) : null}

                {feedback?.debug ? (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                    Source: {feedback.debug.source}. {feedback.debug.reason}
                  </div>
                ) : null}

                {!submitted ? (
                  <p className="text-sm leading-7 text-slate-600">
                    Submit your answer for AI feedback, then mark the card easy, medium, or hard to schedule the next revision.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Score</p>
                      <p className="mt-2 text-3xl font-bold text-ink">{feedback?.score ?? 0} / 100</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                      <p className="font-semibold text-ink">Recommended difficulty</p>
                      <p className="mt-2 capitalize">{feedback?.suggestedDifficulty ?? "medium"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                      <p className="font-semibold text-ink">Strengths</p>
                      <p className="mt-2">{feedback?.strengths?.join(" ")}</p>
                      <p className="mt-4 font-semibold text-ink">Gaps</p>
                      <p className="mt-2">{feedback?.gaps?.join(" ")}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                      <p className="font-semibold text-ink">Improved answer</p>
                      <p className="mt-2">{feedback?.improvedAnswer ?? currentCard.answer}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={onSubmitReview} disabled={reviewPending}>
                    {reviewPending ? "Analyzing..." : "Submit for AI feedback"}
                  </Button>
                  <Button variant="secondary" onClick={onSkipCard}>
                    Skip card
                  </Button>
                </div>

                {submitted ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="min-w-[140px]"
                      onClick={() => onRateCard("easy")}
                      disabled={ratingPending}
                    >
                      Mark easy
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-w-[140px]"
                      onClick={() => onRateCard("medium")}
                      disabled={ratingPending}
                    >
                      Mark medium
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-w-[140px]"
                      onClick={() => onRateCard("hard")}
                      disabled={ratingPending}
                    >
                      Mark hard
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export function StudyRoomPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const [newSubjectTitle, setNewSubjectTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewTime, setReviewTime] = useState("20 minutes");
  const [message, setMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [currentReviewCardId, setCurrentReviewCardId] = useState<string | null>(null);
  const notesFileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === subjectId),
    [subjectId, subjects]
  );
  const mergedChapterItems = useMemo(
    () => mergeChapterItems(selectedSubject),
    [selectedSubject]
  );

  const {
    data: dueCards = [],
    isLoading: dueCardsLoading
  } = useQuery({
    queryKey: ["due-cards", subjectId],
    queryFn: () => getDueCards({ subjectId }),
    enabled: Boolean(subjectId)
  });

  const scopedDueCards = useMemo(() => {
    if (!selectedSubject) {
      return dueCards;
    }

    const chapterIds = new Set(mergedChapterItems.map((chapter) => chapter.id));
    const chapterTitles = new Set(
      mergedChapterItems.map((chapter) => chapter.title.trim().toLowerCase())
    );
    const cardsWithExplicitSubject = dueCards.filter((card) => card.subjectId);
    const cardsWithExplicitChapter = dueCards.filter((card) => card.chapterId);

    if (cardsWithExplicitSubject.length > 0) {
      return dueCards.filter((card) => card.subjectId === selectedSubject.id);
    }

    if (cardsWithExplicitChapter.length > 0) {
      return dueCards.filter((card) => card.chapterId && chapterIds.has(card.chapterId));
    }

    if (chapterTitles.size > 0) {
      return dueCards.filter((card) =>
        chapterTitles.has(card.chapterTitle.trim().toLowerCase())
      );
    }

    return dueCards;
  }, [dueCards, mergedChapterItems, selectedSubject]);

  const currentCard =
    scopedDueCards.find((card) => card.id === currentReviewCardId) ?? scopedDueCards[0] ?? null;

  const createSubjectMutation = useMutation({
    mutationFn: (title: string) => createSubject({ title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    }
  });

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
      aiFeedback: AiFeedback;
    }) => rateReview(flashCardId, { userAnswer, difficultyLabel, aiFeedback }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["due-cards", subjectId] });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    }
  });

  const handleCreateSubject = () => {
    const title = newSubjectTitle.trim();

    if (!title) {
      setMessage("Add a subject name first.");
      return;
    }

    createSubjectMutation
      .mutateAsync(title)
      .then(async () => {
        const refreshed = await queryClient.fetchQuery({
          queryKey: ["subjects"],
          queryFn: getSubjects
        });
        const created = refreshed.find((subject) => subject.title === title);
        if (created) {
          navigate(`/study-room/${created.id}`);
        }
        setNewSubjectTitle("");
        setMessage(`Created subject "${title}".`);
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : "Could not create subject.")
      );
  };

  const handleGenerate = async () => {
    if (!selectedSubject) {
      setMessage("Open a subject before generating flash cards.");
      return;
    }

    if (!chapterTitle.trim() || !notes.trim()) {
      setMessage("Add a chapter title and notes before generating flash cards.");
      return;
    }

    try {
      setIsGenerating(true);
      setMessage(`Saving a new chapter inside ${selectedSubject.title} and generating cards...`);
      const chapterResponse = (await createChapter(selectedSubject.id, {
        title: chapterTitle.trim()
      })) as { chapter: { id: string } };

      await uploadNotes(chapterResponse.chapter.id, {
        title: chapterTitle.trim(),
        content: notes.trim()
      });

      const result = (await generateFlashcards(chapterResponse.chapter.id, {
        estimatedReviewTime: reviewTime.trim(),
        cardsRequested: 6
      })) as { cards: Array<{ id: string }>; debug?: { source: string; reason: string } };

      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["due-cards", selectedSubject.id] });
      await queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-stats"] });

      setCurrentReviewCardId(result.cards[0]?.id ?? null);
      setAnswer("");
      setSubmitted(false);
      setFeedback(null);
      setReviewError("");
      setChapterTitle("");
      setNotes("");
      setMessage(
        result.debug
          ? `Generated ${result.cards.length} flash cards for ${selectedSubject.title} via ${result.debug.source}. ${result.debug.reason}`
          : `Generated ${result.cards.length} flash cards for ${selectedSubject.title}.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate flash cards.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isLikelyTextFile =
      file.type.startsWith("text/") ||
      /\.(txt|md|csv|json)$/i.test(file.name);

    if (!isLikelyTextFile) {
      setMessage("This upload currently supports text-based note files like .txt or .md.");
      event.target.value = "";
      return;
    }

    const content = await file.text();
    setNotes(content);
    setSelectedFileName(file.name);

    if (!chapterTitle.trim()) {
      setChapterTitle(deriveChapterTitleFromFileName(file.name));
    }

    setMessage(`Loaded notes from ${file.name}. You can edit them before generating cards.`);
    event.target.value = "";
  };

  const handlePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsParsingPdf(true);
      setSelectedFileName(file.name);
      setMessage(`Extracting text from ${file.name}...`);
      const result = await extractTextFromPdf(file);
      setNotes(result.text);

      if (!chapterTitle.trim()) {
        setChapterTitle(deriveChapterTitleFromFileName(file.name));
      }

      setMessage(`Loaded extracted text from ${file.name}. You can review and generate cards now.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not parse the PDF.");
    } finally {
      event.target.value = "";
      setIsParsingPdf(false);
    }
  };

  const handleSkipCard = () => {
    queryClient.setQueryData(
      ["due-cards", subjectId],
      (current: typeof dueCards | undefined) =>
        current && current.length > 1 ? [...current.slice(1), current[0]] : current
    );
    setCurrentReviewCardId(null);
    setAnswer("");
    setSubmitted(false);
    setFeedback(null);
    setReviewError("");
  };

  const handleSubmitForReview = async () => {
    if (!currentCard) {
      setReviewError("Choose a due card first.");
      return;
    }

    if (!answer.trim()) {
      setReviewError("Type an answer before asking AI to review it.");
      return;
    }

    try {
      setReviewError("");
      const result = await reviewMutation.mutateAsync({
        flashCardId: currentCard.id,
        userAnswer: answer.trim()
      });
      setFeedback({ ...result.feedback });
      setSubmitted(true);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "AI review failed.");
    }
  };

  const handleRateCard = async (difficultyLabel: "easy" | "medium" | "hard") => {
    if (!currentCard || !feedback) {
      return;
    }

    try {
      setReviewError("");
      await ratingMutation.mutateAsync({
        flashCardId: currentCard.id,
        userAnswer: answer.trim(),
        difficultyLabel,
        aiFeedback: feedback
      });
      setCurrentReviewCardId(null);
      setAnswer("");
      setSubmitted(false);
      setFeedback(null);
      setReviewError(
        difficultyLabel === "hard"
          ? "Marked hard. This card will return again soon."
          : ""
      );
      if (difficultyLabel === "hard") {
        setMessage("Marked hard. This card is scheduled to return in about 10 minutes.");
      }
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Could not save your review.");
    }
  };

  if (!subjectId) {
    return (
      <SubjectDirectory
        subjects={subjects}
        newSubjectTitle={newSubjectTitle}
        setNewSubjectTitle={setNewSubjectTitle}
        handleCreateSubject={handleCreateSubject}
        message={message}
        onOpenSubject={(id) => navigate(`/study-room/${id}`)}
      />
    );
  }

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] bg-white p-6 shadow-soft">
          <Link to="/study-room" className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
            Back to subjects
          </Link>
          <h1 className="mt-4 font-display text-4xl text-ink">Subject not found</h1>
          <p className="mt-3 text-slate-600">
            This subject could not be loaded. Go back to your subject list and open another one.
          </p>
        </section>
      </div>
    );
  }

  return (
      <SubjectWorkspace
      subject={selectedSubject}
      mergedChapterItems={mergedChapterItems}
      dueCards={scopedDueCards}
      dueCardsLoading={dueCardsLoading}
      chapterTitle={chapterTitle}
      setChapterTitle={setChapterTitle}
      notes={notes}
      setNotes={setNotes}
      reviewTime={reviewTime}
      setReviewTime={setReviewTime}
      selectedFileName={selectedFileName}
      message={message}
      isGenerating={isGenerating}
      isParsingPdf={isParsingPdf}
      notesFileInputRef={notesFileInputRef}
      pdfFileInputRef={pdfFileInputRef}
      onImportNotesClick={() => notesFileInputRef.current?.click()}
      onUploadPdfClick={() => pdfFileInputRef.current?.click()}
      onImportNotesChange={handleTextFileUpload}
      onUploadPdfChange={handlePdfUpload}
      onGenerate={handleGenerate}
      currentCard={currentCard}
      setCurrentReviewCardId={setCurrentReviewCardId}
      answer={answer}
      setAnswer={setAnswer}
      submitted={submitted}
      feedback={feedback}
      reviewError={reviewError}
      reviewPending={reviewMutation.isPending}
      ratingPending={ratingMutation.isPending}
      onSubmitReview={handleSubmitForReview}
      onSkipCard={handleSkipCard}
      onRateCard={handleRateCard}
    />
  );
}
