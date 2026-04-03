import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { subjects as initialSubjects } from "../data/mock";
import type { AiFeedback, ReviewCard, Subject } from "../types";

const STORAGE_KEY = "flash-card-generator.study";
const STORAGE_VERSION = 2;

type StudyState = {
  subjects: Subject[];
  reviewCards: ReviewCard[];
  selectedSubjectId: string | null;
  createSubject: (title: string) => void;
  selectSubject: (subjectId: string) => void;
  addGeneratedFlashcards: (input: {
    subjectId: string;
    cards: ReviewCard[];
  }) => void;
  saveReviewFeedback: (input: {
    cardId: string;
    userAnswer: string;
    aiFeedback: AiFeedback;
  }) => void;
  completeReview: (cardId: string, difficulty: "easy" | "medium" | "hard") => void;
  skipCard: (cardId: string) => void;
};

const StudyContext = createContext<StudyState | null>(null);

export function StudyProvider({ children }: PropsWithChildren) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    initialSubjects[0]?.id ?? null
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as {
      version?: number;
      subjects: Subject[];
      reviewCards: ReviewCard[];
      selectedSubjectId: string | null;
    };

    const filteredCards =
      parsed.version === STORAGE_VERSION
        ? parsed.reviewCards
        : parsed.reviewCards.filter(
            (card) =>
              card.id !== "c1" &&
              card.id !== "c2" &&
              card.question !== "Explain the difference between mitosis and meiosis." &&
              card.question !== "Why does TCP use a three-way handshake before data transfer?"
          );

    setSubjects(parsed.subjects);
    setReviewCards(filteredCards);
    setSelectedSubjectId(parsed.selectedSubjectId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        subjects,
        reviewCards,
        selectedSubjectId
      })
    );
  }, [reviewCards, selectedSubjectId, subjects]);

  const value = useMemo<StudyState>(
    () => ({
      subjects,
      reviewCards,
      selectedSubjectId,
      createSubject: (title) => {
        const newSubject: Subject = {
          id: `subject-${crypto.randomUUID()}`,
          title,
          chapters: 0,
          cardsDue: 0,
          accent: "from-cyan-300 to-teal-500"
        };
        setSubjects((current) => [newSubject, ...current]);
        setSelectedSubjectId(newSubject.id);
      },
      selectSubject: (subjectId) => setSelectedSubjectId(subjectId),
      addGeneratedFlashcards: ({ subjectId, cards }) => {
        setReviewCards((current) => [...cards, ...current]);
        setSubjects((current) =>
          current.map((subject) =>
            subject.id === subjectId
              ? {
                  ...subject,
                  chapters: subject.chapters + 1,
                  cardsDue: subject.cardsDue + cards.length
                }
              : subject
          )
        );
        setSelectedSubjectId(subjectId);
      },
      saveReviewFeedback: ({ cardId, userAnswer, aiFeedback }) => {
        setReviewCards((current) =>
          current.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  userAnswer,
                  aiFeedback
                }
              : card
          )
        );
      },
      completeReview: (cardId, difficulty) => {
        const reviewedCard = reviewCards.find((card) => card.id === cardId);
        const nextReviewLabel =
          difficulty === "easy"
            ? "Review again in 5 days"
            : difficulty === "medium"
              ? "Review again in 2 days"
              : "Review again tomorrow";

        setReviewCards((current) =>
          current.map((card) =>
            card.id === cardId
              ? { ...card, difficulty, status: "completed", nextReviewLabel }
              : card
          )
        );

        if (reviewedCard?.subjectId) {
          setSubjects((current) =>
            current.map((subject) =>
              subject.id === reviewedCard.subjectId
                ? { ...subject, cardsDue: Math.max(0, subject.cardsDue - 1) }
                : subject
            )
          );
        }
      },
      skipCard: (cardId) => {
        setReviewCards((current) => {
          const card = current.find((entry) => entry.id === cardId);
          if (!card) {
            return current;
          }

          return [...current.filter((entry) => entry.id !== cardId), card];
        });
      }
    }),
    [reviewCards, selectedSubjectId, subjects]
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);

  if (!context) {
    throw new Error("useStudy must be used within StudyProvider");
  }

  return context;
}
