import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChapter, createSubject, generateFlashcards, getSubjects, uploadNotes } from "../lib/api";

const presets = [
  { emoji: "🧠", color: "#6C5CE7" },
  { emoji: "📘", color: "#8575FF" },
  { emoji: "🧪", color: "#5E60CE" },
  { emoji: "📚", color: "#7F6BFF" }
];

export default function StudyRoomPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newSubjectTitle, setNewSubjectTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [reviewTime, setReviewTime] = useState("20");
  const [selectedFile, setSelectedFile] = useState(null);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [generationError, setGenerationError] = useState("");

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });

  const activeSubject = useMemo(() => {
    if (!subjects.length) {
      return null;
    }
    return subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
  }, [subjectId, subjects]);

  const activeChapter = useMemo(() => {
    if (!activeSubject?.chapters?.length) {
      return null;
    }

    return activeSubject.chapters.find((chapter) => chapter.id === selectedChapterId) ?? null;
  }, [activeSubject, selectedChapterId]);

  useEffect(() => {
    if (!activeSubject?.chapters?.length) {
      setSelectedChapterId(null);
      return;
    }

    setSelectedChapterId((current) => {
      if (current && activeSubject.chapters.some((chapter) => chapter.id === current)) {
        return current;
      }

      return activeSubject.chapters[0].id;
    });
  }, [activeSubject]);

  useEffect(() => {
    setNoteTitle(activeChapter?.title ? `${activeChapter.title} notes` : "");
    setNoteText("");
    setSelectedFile(null);
    setGeneratedCards([]);
    setGenerationError("");
  }, [activeChapter?.id]);

  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      setNewSubjectTitle("");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ chapterId }) =>
      uploadNotes(chapterId, {
        title: noteTitle || chapterTitle || "Lecture notes",
        content: noteText,
        file: selectedFile
      })
  });

  const generateMutation = useMutation({
    mutationFn: ({ chapterId }) =>
      generateFlashcards(chapterId, {
        estimatedReviewTime: reviewTime,
        cardsRequested: 8
      })
  });

  const chapterMutation = useMutation({
    mutationFn: ({ currentSubjectId, payload }) => createChapter(currentSubjectId, payload),
    onSuccess: async (chapter) => {
      setSelectedChapterId(chapter.id);
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    }
  });

  function handleCreateSubject() {
    if (!newSubjectTitle.trim()) {
      return;
    }
    const preset = presets[subjects.length % presets.length];
    createSubjectMutation.mutate({
      title: newSubjectTitle,
      emoji: preset.emoji,
      color: preset.color
    });
  }

  async function handleGenerate() {
    if (!activeSubject || !activeChapter) {
      return;
    }

    const hasFreshNotes = Boolean(noteText.trim() || selectedFile);
    const hasExistingNotes = (activeChapter.notesCount ?? 0) > 0;

    if (!hasFreshNotes && !hasExistingNotes) {
      setGenerationError("Add notes or upload a file for this chapter before generating flashcards.");
      return;
    }

    setGenerationError("");

    try {
      if (hasFreshNotes) {
        await uploadMutation.mutateAsync({ chapterId: activeChapter.id });
      }

      const response = await generateMutation.mutateAsync({
        chapterId: activeChapter.id
      });

      setGeneratedCards(response.cards ?? []);
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    } catch (error) {
      setGenerationError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to generate flashcards right now."
      );
    }
  }

  async function handleCreateChapter() {
    if (!activeSubject || !chapterTitle.trim()) {
      return;
    }

    const chapter = await chapterMutation.mutateAsync({
      currentSubjectId: activeSubject.id,
      payload: { title: chapterTitle }
    });
    setChapterTitle("");
    navigate(`/study-room/${activeSubject.id}`);
    return chapter;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-[2rem] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Subjects</h2>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">{subjects.length}</span>
        </div>
        <div className="mt-5 space-y-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => navigate(`/study-room/${subject.id}`)}
              className={`w-full rounded-[1.2rem] p-4 text-left ${activeSubject?.id === subject.id ? "bg-brand text-white" : "bg-brand-soft text-ink"}`}
            >
              <div className="font-medium">{subject.title}</div>
              <div className={`mt-2 text-sm ${activeSubject?.id === subject.id ? "text-white/80" : "text-muted"}`}>
                {subject.chapterCount} chapters • {subject.cardsDue} due
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-[1.4rem] bg-brand-soft p-4">
          <input value={newSubjectTitle} onChange={(event) => setNewSubjectTitle(event.target.value)} placeholder="New subject" className="w-full rounded-xl border border-brand-mid bg-white px-4 py-3 outline-none" />
          <button type="button" onClick={handleCreateSubject} className="mt-3 w-full rounded-full bg-brand px-4 py-3 font-medium text-white">Create Subject</button>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.24em] text-brand">My Study Room</p>
          <h1 className="mt-3 text-4xl font-semibold">{activeSubject ? `${activeSubject.title} workspace` : "Create your first subject"}</h1>
          <p className="mt-3 text-muted">Pick a subject, open one of its chapters, then upload notes or jump into review for that chapter.</p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Chapters</h2>
              <p className="mt-2 text-sm text-muted">Click a chapter card to open its notes and review actions.</p>
            </div>
            <div className="flex w-full gap-3 md:w-auto">
              <input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="New chapter title" className="w-full rounded-2xl border border-brand-mid px-4 py-3 outline-none md:w-80" />
              <button type="button" onClick={handleCreateChapter} className="rounded-full bg-brand px-5 py-3 font-medium text-white">Create Chapter</button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {activeSubject?.chapters?.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setSelectedChapterId(chapter.id)}
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  activeChapter?.id === chapter.id
                    ? "border-brand bg-brand text-white"
                    : "border-brand-mid bg-brand-soft text-ink"
                }`}
              >
                <div className="text-lg font-semibold">{chapter.title}</div>
                <div className={`mt-2 text-sm ${activeChapter?.id === chapter.id ? "text-white/85" : "text-muted"}`}>
                  {chapter.notesCount} note uploads • {chapter.flashcardsCount} flashcards
                </div>
                <div className={`mt-4 text-sm font-medium ${activeChapter?.id === chapter.id ? "text-white" : "text-brand"}`}>
                  Open chapter workspace
                </div>
              </button>
            ))}
            {!activeSubject?.chapters?.length ? (
              <div className="rounded-[1.4rem] border border-dashed border-brand-mid bg-brand-soft p-5 text-sm text-muted">
                Create your first chapter for this subject to upload notes and start reviewing.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {activeChapter ? `${activeChapter.title} workspace` : "Chapter workspace"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {activeChapter
                  ? "Upload notes for this chapter or review the flashcards already generated for it."
                  : "Select a chapter first to open its notes and review actions."}
              </p>
            </div>
            {activeChapter ? (
              <button
                type="button"
                onClick={() => navigate("/review", { state: { subjectId: activeSubject?.id, chapterId: activeChapter.id } })}
                className="rounded-full bg-brand px-5 py-3 font-medium text-white"
              >
                Review This Chapter
              </button>
            ) : null}
          </div>

          {activeChapter ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Notes title" className="rounded-2xl border border-brand-mid px-4 py-3 outline-none" />
                <div className="rounded-[1.4rem] bg-brand-soft p-4">
                  <label className="text-sm text-muted">How many minutes do you want to review?</label>
                  <input value={reviewTime} onChange={(event) => setReviewTime(event.target.value)} className="mt-2 w-full rounded-xl border border-brand-mid bg-white px-4 py-3 outline-none" />
                </div>
              </div>
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder={`Paste notes for ${activeChapter.title} here...`} className="mt-4 min-h-48 w-full rounded-[1.5rem] border border-brand-mid px-4 py-4 outline-none" />
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
                <label className="rounded-[1.4rem] border border-dashed border-brand-mid bg-brand-soft px-4 py-4 text-sm text-muted">
                  Upload notes (.pdf, .txt, .docx)
                  <input type="file" className="mt-2 block w-full" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                </label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={uploadMutation.isPending || generateMutation.isPending}
                  className="rounded-[1.4rem] bg-brand px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploadMutation.isPending || generateMutation.isPending
                    ? "Generating Flashcards..."
                    : "Upload Notes and Generate Flashcards"}
                </button>
              </div>
              {generationError ? <p className="mt-3 text-sm font-medium text-red-500">{generationError}</p> : null}
              {!generationError && (activeChapter.notesCount ?? 0) > 0 && !noteText.trim() && !selectedFile ? (
                <p className="mt-3 text-sm text-muted">
                  Using the latest saved notes for this chapter. Add new notes only if you want to replace them.
                </p>
              ) : null}
            </>
          ) : null}

          <div className="mt-6 space-y-4">
            {generatedCards.map((card, index) => (
              <div key={card.id ?? `${card.question}-${index}`} className="rounded-[1.4rem] bg-brand-soft p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-brand">{card.type}</div>
                <input
                  value={card.question}
                  onChange={(event) => setGeneratedCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))}
                  className="mt-3 w-full rounded-xl border border-brand-mid bg-white px-4 py-3 outline-none"
                />
                <textarea
                  value={card.referenceAnswer}
                  onChange={(event) => setGeneratedCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, referenceAnswer: event.target.value } : item))}
                  className="mt-3 min-h-28 w-full rounded-xl border border-brand-mid bg-white px-4 py-3 outline-none"
                />
                <button type="button" onClick={() => setGeneratedCards((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-3 text-sm font-medium text-red-500">Delete card</button>
              </div>
            ))}
            {activeChapter && generatedCards.length === 0 ? <p className="text-muted">Generate flashcards to preview and edit them here.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
