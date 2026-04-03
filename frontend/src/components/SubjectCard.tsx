import type { Subject } from "../types";
import { Button } from "./Button";

type Props = {
  subject: Subject;
  onOpen?: (subjectId: string) => void;
};

export function SubjectCard({ subject, onOpen }: Props) {
  return (
    <div className="group overflow-hidden rounded-[28px] bg-white shadow-soft transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
      <div className={`h-3 bg-gradient-to-r ${subject.accent}`} />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl text-ink">{subject.title}</h3>
            <p className="text-sm text-slate-500">{subject.chapters} chapters</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition group-hover:bg-teal/10 group-hover:text-teal">
            {subject.cardsDue} due
          </span>
        </div>
        <Button variant="ghost" className="px-0 py-0 text-sm font-semibold text-teal" onClick={() => onOpen?.(subject.id)}>
          Open study room
        </Button>
      </div>
    </div>
  );
}
