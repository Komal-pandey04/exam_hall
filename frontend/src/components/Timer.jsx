import { Clock } from 'lucide-react';
import { formatClock } from '../utils/format.js';

/**
 * Remaining time (main figure) + elapsed time (small line).
 * Neutral > amber at 5 minutes > red (pulsing) at 1 minute.
 */
export default function Timer({ seconds, elapsed }) {
  const critical = seconds <= 60;
  const warning = seconds <= 300;
  const tone = critical ? 'border-red-300 bg-red-50 text-red-700' : warning ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-800';
  return (
    <div role="timer" aria-label={`Time remaining ${formatClock(seconds)}${elapsed != null ? `, elapsed ${formatClock(elapsed)}` : ''}`} className={`rounded-lg border px-2.5 py-1 font-mono tabular-nums sm:px-3 ${tone} ${critical ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-1.5 text-base font-bold leading-tight sm:text-lg">
        <Clock size={16} aria-hidden="true" />
        <span data-testid="remaining">{formatClock(seconds)}</span>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wide opacity-70">left</span>
      </div>
      {elapsed != null && (
        <div className="text-[11px] leading-tight opacity-80">
          <span data-testid="elapsed">{formatClock(elapsed)}</span> <span className="font-sans uppercase tracking-wide">elapsed</span>
        </div>
      )}
    </div>
  );
}
