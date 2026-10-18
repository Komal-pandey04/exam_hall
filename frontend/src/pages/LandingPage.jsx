import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookCheck, Clock, Flag, ListChecks, Smartphone, Timer, Zap } from 'lucide-react';
import Button from '../components/Button.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { loadSession } from '../utils/sessionStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMarks } from '../utils/format.js';

const FEATURES = [
  { icon: Timer, title: 'Real countdown timer', text: 'Absolute-time clock that survives refreshes, tab switches and sleeping devices — and submits automatically at zero.' },
  { icon: ListChecks, title: 'Question palette', text: 'Jump to any question and see answered, skipped and review-marked questions at a glance.' },
  { icon: Zap, title: 'Instant marking', text: 'Practice mode marks every answer the moment you pick it, with a full explanation.' },
  { icon: BarChart3, title: 'Detailed score report', text: 'Score, percentage, accuracy, time taken and a question-by-question review.' },
  { icon: Flag, title: 'Mark for review', text: 'Flag tricky questions and come back before you submit.' },
  { icon: Smartphone, title: 'Works on every screen', text: 'Phone, tablet or desktop — the palette becomes a drawer and controls stay thumb-friendly.' },
];

const STEPS = [
  ['Sign up & choose', 'Create an account and pick a mock test.'],
  ['Attempt it', 'Answer MCQs, flag doubts and watch the timer.'],
  ['Submit', 'Confirm, or let the timer submit for you.'],
  ['Review', 'See your score and learn from every explanation.'],
];

export default function LandingPage() {
  const tests = useFetch(() => api.getTests());
  const stats = useFetch(() => api.getStats());
  const { user } = useAuth();
  const myResults = useFetch(() => (user ? api.myResults() : Promise.resolve({ results: [] })), [user?.id]);
  const unfinished = user ? loadSession() : null;
  const mocks = (tests.data?.tests ?? []).filter((t) => t.category === 'mock');
  const practice = (tests.data?.tests ?? []).filter((t) => t.category !== 'mock');
  const resultsByTest = {};
  (myResults.data?.results ?? []).forEach((r) => { resultsByTest[r.testId] = Math.max(resultsByTest[r.testId] ?? -Infinity, r.score); });

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800">
              <BookCheck size={16} /> UKSSSC Assistant Accountant
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Practice. Score. Improve.</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
              25 full-length mock tests for UKSSSC Assistant Accountant, plus chapter practice sets. Answer, get marked with negative marking, and see exactly where you stand.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as="a" href="#tests" size="lg">Start Test <ArrowRight size={18} /></Button>
              {unfinished && <Button as={Link} to="/exam" size="lg" variant="secondary">Resume unfinished test</Button>}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 text-center">
            {[['Tests', stats.data?.tests], ['Questions', stats.data?.questions], ['Attempts', stats.data?.attempts]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                <dd className="text-3xl font-extrabold tabular-nums text-indigo-800">{value ?? '–'}</dd>
                <dt className="mt-1 text-sm text-slate-600">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="tests" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6">
        {tests.loading && <LoadingState label="Loading tests…" />}
        {tests.error && <ErrorState error={tests.error} onRetry={tests.reload} title="Couldn't load tests" />}
        {tests.data && tests.data.tests.length === 0 && <EmptyState title="No tests available yet" message="Ask the administrator to add a test." />}
        {mocks.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-slate-900">Mock Tests</h2>
            <p className="mt-1 text-slate-600">
              {mocks.length} full-length tests · 100 questions each · +1 for a correct answer, −0.25 for a wrong answer, 0 if unattempted.
              {!user && <> <Link to="/login" className="font-semibold text-indigo-800 hover:underline">Log in</Link> to start.</>}
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {mocks.map((t) => (
                <li key={t.id}>
                  <Link to={`/test/${t.id}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-400">
                    <span className="font-bold text-slate-900">{t.title}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-600"><ListChecks size={13} /> {t.questionCount} questions</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600"><Clock size={13} /> {t.durationMinutes} min · {t.totalMarks} marks</span>
                    {resultsByTest[t.id] && <span className="mt-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Best: {formatMarks(resultsByTest[t.id])}/{t.totalMarks}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {practice.length > 0 && (
          <div className={mocks.length ? 'mt-16' : ''}>
            <h2 className="text-2xl font-bold text-slate-900">Chapter practice sets</h2>
            <p className="mt-1 text-slate-600">Shorter timed sets with instant marking available in practice mode.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {practice.map((t) => (
                <li key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold leading-snug text-slate-900">{t.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{t.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1"><ListChecks size={15} /> {t.questionCount} questions</span>
                    <span className="inline-flex items-center gap-1"><Clock size={15} /> {t.durationMinutes} min</span>
                  </div>
                  <Button as={Link} to={`/test/${t.id}`} className="mt-5">View &amp; start <ArrowRight size={16} /></Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900">Built like a real exam platform</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-800"><Icon size={20} /></span>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-700 font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
