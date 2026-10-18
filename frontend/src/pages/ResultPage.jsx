import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Home, MinusCircle, RotateCcw, Target, XCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import ReviewList from '../components/ReviewList.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import TimeBreakdown from '../components/TimeBreakdown.jsx';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { formatDuration, formatMarks } from '../utils/format.js';

function verdict(p) {
  if (p >= 85) return 'Outstanding work!';
  if (p >= 60) return 'Good job — keep going!';
  if (p >= 40) return 'A decent start. Review the explanations below.';
  return 'Keep practising — the explanations below will help.';
}

export default function ResultPage() {
  const { attemptId } = useParams();
  const { state } = useLocation();
  const passed = state?.result?.attemptId === attemptId ? state.result : null;
  const { data, error, loading, reload } = useFetch(() => (passed ? Promise.resolve({ result: passed }) : api.getResult(attemptId)), [attemptId]);

  if (loading) return <LoadingState label="Loading your result…" />;
  if (error) return <ErrorState error={error} onRetry={reload} title={error.status === 404 ? 'Result not found' : "Couldn't load your result"} />;

  const r = data.result;
  const gained = r.review.reduce((n, x) => n + (x.awarded > 0 ? x.awarded : 0), 0);
  const lost = r.review.reduce((n, x) => n + (x.awarded < 0 ? -x.awarded : 0), 0);
  const markPer = r.review[0]?.marks ?? 1;
  const penalty = r.wrong ? lost / r.wrong : 0;
  const stats = [
    { icon: CheckCircle2, label: 'Correct', value: r.correct, tone: 'text-emerald-700 bg-emerald-50' },
    { icon: XCircle, label: 'Wrong', value: r.wrong, tone: 'text-red-700 bg-red-50' },
    { icon: MinusCircle, label: 'Unanswered', value: r.unanswered, tone: 'text-amber-700 bg-amber-50' },
    { icon: Target, label: 'Accuracy', value: `${r.accuracy}%`, tone: 'text-indigo-800 bg-indigo-50' },
    { icon: Clock, label: 'Total time taken', value: formatDuration(r.timeTaken), tone: 'text-slate-800 bg-slate-100' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-medium text-slate-600">{r.testTitle} · {r.mode === 'practice' ? 'Practice mode' : 'Exam mode'}</p>
      <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{r.studentName}, here is your result</h1>

      {r.autoSubmitted && <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Time ran out, so your test was submitted automatically.</p>}

      <section className="mt-6 grid items-center gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr] sm:p-8">
        <div className="mx-auto"><ScoreRing percentage={r.percentage} /></div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Marks obtained</p>
          <p className="mt-1 text-5xl font-extrabold tabular-nums text-slate-900">
            {formatMarks(r.score)} <span className="text-2xl font-semibold text-slate-500">/ {formatMarks(r.maxScore)}</span>
          </p>
          <p className="mt-3 text-slate-700">{verdict(r.percentage)}</p>
          <p className="mt-1 text-sm text-slate-600">Attempted {r.attempted} of {r.totalQuestions} questions</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Button as={Link} to={`/test/${r.testId}`}><RotateCcw size={16} /> Retake Test</Button>
            <Button as={Link} to="/" variant="secondary"><Home size={16} /> Back to Home</Button>
          </div>
        </div>
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className={`rounded-xl p-4 ${tone}`}>
            <dt className="flex items-center gap-1.5 text-xs font-medium"><Icon size={14} /> {label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {r.review.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800" aria-label="Marking breakdown">
          <h2 className="font-semibold text-slate-900">Marking breakdown</h2>
          <p className="mt-2 tabular-nums">
            {r.correct} correct × +{formatMarks(markPer)} = <strong>+{formatMarks(gained)}</strong>
            {' · '}{r.wrong} wrong × −{formatMarks(penalty)} = <strong>−{formatMarks(lost)}</strong>
            {' · '}{r.unanswered} unattempted × 0 = <strong>0</strong>
            {' → '}<strong>{formatMarks(r.score)} / {formatMarks(r.maxScore)}</strong>
          </p>
        </section>
      )}

      <div className="mt-8">
        <TimeBreakdown review={r.review} totalSeconds={r.timeTaken} />
      </div>

      <div className="mt-10">
        <ReviewList review={r.review} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button as={Link} to={`/test/${r.testId}`}><RotateCcw size={16} /> Retake Test</Button>
        <Button as={Link} to="/" variant="secondary"><Home size={16} /> Back to Home</Button>
      </div>
    </div>
  );
}
