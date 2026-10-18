import { useMemo } from 'react';
import { Clock, Gauge, Hourglass, Zap } from 'lucide-react';
import { formatDuration } from '../utils/format.js';

const BAR_TONE = { correct: 'bg-emerald-500', wrong: 'bg-red-500', unanswered: 'bg-amber-400' };

/** Total test time + time invested in every question. */
export default function TimeBreakdown({ review, totalSeconds }) {
  const data = useMemo(() => {
    const rows = review.map((r) => ({ id: r.questionId, number: r.position, seconds: r.timeSpent ?? 0, status: r.status }));
    const tracked = rows.reduce((sum, r) => sum + r.seconds, 0);
    const longest = rows.reduce((a, b) => (b.seconds > a.seconds ? b : a), rows[0]);
    const answered = rows.filter((r) => r.status !== 'unanswered' && r.seconds > 0);
    const quickest = answered.length ? answered.reduce((a, b) => (b.seconds < a.seconds ? b : a)) : null;
    return { rows, tracked, longest, quickest, max: Math.max(1, longest.seconds), average: tracked / Math.max(1, rows.length) };
  }, [review]);

  // Results saved before time tracking existed have no per-question data.
  if (review.every((r) => r.timeSpent === undefined)) return null;

  const cards = [
    { icon: Clock, label: 'Total test time', value: formatDuration(totalSeconds), tone: 'bg-indigo-50 text-indigo-900' },
    { icon: Gauge, label: 'Average per question', value: formatDuration(data.average), tone: 'bg-slate-100 text-slate-900' },
    { icon: Hourglass, label: 'Longest', value: `${formatDuration(data.longest.seconds)} · Q${data.longest.number}`, tone: 'bg-slate-100 text-slate-900' },
    { icon: Zap, label: 'Quickest answered', value: data.quickest ? `${formatDuration(data.quickest.seconds)} · Q${data.quickest.number}` : '–', tone: 'bg-slate-100 text-slate-900' },
  ];

  return (
    <section aria-labelledby="time-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 id="time-heading" className="text-xl font-bold text-slate-900">Time invested</h2>
      <p className="mt-1 text-sm text-slate-600">
        You spent {formatDuration(data.tracked)} actively working on questions out of {formatDuration(totalSeconds)} total.
        Time away from this tab is not counted per question.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className={`rounded-xl p-3.5 ${tone}`}>
            <dt className="flex items-center gap-1.5 text-xs font-medium"><Icon size={14} /> {label}</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-hidden="true">
        {[['correct', 'Correct'], ['wrong', 'Incorrect'], ['unanswered', 'Unanswered']].map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${BAR_TONE[k]}`} /> {label}</span>
        ))}
      </div>

      <ol className="mt-3 space-y-1.5" aria-label="Time spent on each question">
        {data.rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 text-sm">
            <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-slate-700">Q{row.number}</span>
            <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span className={`block h-full rounded-full ${BAR_TONE[row.status]}`} style={{ width: `${row.seconds > 0 ? Math.max(2, (row.seconds / data.max) * 100) : 0}%` }} />
            </span>
            <span className="w-16 shrink-0 text-right tabular-nums text-slate-700">{formatDuration(row.seconds)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
