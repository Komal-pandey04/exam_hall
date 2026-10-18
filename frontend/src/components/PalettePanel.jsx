import QuestionPalette, { PaletteLegend } from './QuestionPalette.jsx';

/** Palette + counters + legend. Used in the desktop sidebar and the mobile drawer. */
export default function PalettePanel({ questions, session, summary, onJump }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Answered" value={summary.answered} tone="text-emerald-700" />
        <Stat label="Not answered" value={summary.unanswered} tone="text-amber-700" />
        <Stat label="Marked" value={summary.marked} tone="text-violet-700" />
      </div>
      <QuestionPalette questions={questions} session={session} onJump={onJump} />
      <div className="border-t border-slate-200 pt-4">
        <PaletteLegend />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className={`text-lg font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-slate-600">{label}</div>
    </div>
  );
}
