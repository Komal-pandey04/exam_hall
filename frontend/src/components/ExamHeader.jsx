import { CheckCheck, LayoutGrid, Send } from 'lucide-react';
import Button from './Button.jsx';
import Timer from './Timer.jsx';

export default function ExamHeader({ title, mode, current, total, answered, seconds, elapsed, tally, onOpenPalette, onSubmit, submitting }) {
  const progress = total ? Math.round((answered / total) * 100) : 0;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
        <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-700 text-white sm:grid" aria-hidden="true">
          <CheckCheck size={18} strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h1>
          <p className="truncate text-xs text-slate-600">
            Question {current} of {total} · {answered} answered
            {mode === 'practice' && tally.checked > 0 && <span className="font-medium text-emerald-700"> · {tally.correct}/{tally.checked} correct</span>}
          </p>
        </div>
        <Timer seconds={seconds} elapsed={elapsed} />
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open question palette"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 lg:hidden"
        >
          <LayoutGrid size={20} />
        </button>
        <Button onClick={onSubmit} disabled={submitting} className="shrink-0 !px-3 sm:!px-5" aria-label="Submit test">
          <Send size={16} />
          <span className="hidden sm:inline">Submit Test</span>
          <span className="sm:hidden">Submit</span>
        </Button>
      </div>
      <div className="h-1 bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Answered progress">
        <div className="h-full bg-indigo-700 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
