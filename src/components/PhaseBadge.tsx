import type { LessonPhase } from "../types/curriculum";

const phaseNumber: Record<LessonPhase, string> = {
  의심하기: "1막",
  "확인하고 만들기": "2막",
  "해설사 되기": "3막",
};

export function PhaseBadge({ phase }: { phase: LessonPhase }) {
  return (
    <span className={`phase-badge phase-badge--${phaseNumber[phase][0]}`}>
      <span>{phaseNumber[phase]}</span>
      {phase}
    </span>
  );
}
