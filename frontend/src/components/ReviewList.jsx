import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, MinusCircle, XCircle } from 'lucide-react';
import { formatDuration, formatMarks, optionLetter } from '../utils/format.js';

const STATUS = {
  correct: { label: 'Correct', icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-800', border: 'border-l-emerald-500' },
  wrong: { label: 'Incorrect', icon: XCircle, badge: 'bg-red-100 text-red-800', border: 'border-l-red-500' },
  unanswered: { label: 'Unanswered', icon: MinusCircle, badge: 'bg-amber-100 text-amber-800', border: 'border-l-amber-500' },
};

const FILTERS = [
  ['all', 'All'],
  ['correct', 'Correct'],
  ['wrong', 'Incorrect'],
  ['unanswered', 'Unanswered'],
];

export default function ReviewList({ review }) {
  const [filter, setFilter] = useState('all');
  const counts = useMemo(() => {
    const c = { all: review.length, correct: 0, wrong: 0, unanswered: 0 };
    review.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [review]);
  const visible = filter === 'all' ? review : review.filter((r) => r.status === filter);

  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading" className="text-xl font-bold text-slate-900">Review answers</h2>
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter questions">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === key ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <ol className="mt-4 space-y-4">
        {visible.map((item) => {
          const s = STATUS[item.status];
          const Icon = s.icon;
          return (
            <li key={item.questionId} className={`rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${s.border}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-900">Q{item.position}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${s.badge}`}><Icon size={13} /> {s.label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{item.awarded > 0 ? '+' : ''}{formatMarks(item.awarded)} / {formatMarks(item.marks)}</span>
                {item.timeSpent !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 tabular-nums text-slate-700" title="Time you spent on this question"><Clock size={12} /> {formatDuration(item.timeSpent)}</span>
                )}
                {item.source && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">{item.source}</span>}
              </div>
              <p className="mt-3 whitespace-pre-line break-words font-medium leading-7 text-slate-900">{item.question}</p>
              {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="mt-3 max-h-56 max-w-full rounded-lg border border-slate-200" />}

              <ul className="mt-3 space-y-2">
                {item.options.map((text, i) => {
                  const isCorrect = i === item.correctIndex;
                  const isPick = i === item.selectedIndex;
                  const tone = isCorrect ? 'border-emerald-500 bg-emerald-50' : isPick ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white';
                  return (
                    <li key={i} className={`flex items-start gap-3 rounded-lg border p-2.5 text-sm ${tone}`}>
                      <span className="font-bold text-slate-700">{optionLetter(i)}.</span>
                      <span className="min-w-0 flex-1 break-words text-slate-800">{text}</span>
                      {isCorrect && <span className="shrink-0 text-xs font-semibold text-emerald-700">Correct answer</span>}
                      {isPick && !isCorrect && <span className="shrink-0 text-xs font-semibold text-red-700">Your answer</span>}
                      {isPick && isCorrect && <span className="shrink-0 text-xs font-semibold text-emerald-700">· Your answer</span>}
                    </li>
                  );
                })}
              </ul>
              {item.selectedIndex === null && <p className="mt-2 text-sm font-medium text-amber-800">You did not answer this question.</p>}

              {item.explanation && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold text-slate-900">Explanation: </span>
                  {item.explanation}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {visible.length === 0 && <p className="mt-6 text-center text-sm text-slate-600">No questions in this category.</p>}
    </section>
  );
}
