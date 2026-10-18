import { Link } from 'react-router-dom';
import { Clock, History, LogIn, LogOut, ShieldAlert, UserPlus } from 'lucide-react';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { formatDuration, formatMarks } from '../utils/format.js';

const EVENTS = {
  signup: { label: 'Signed up', icon: UserPlus, tone: 'text-indigo-800 bg-indigo-50' },
  login: { label: 'Logged in', icon: LogIn, tone: 'text-emerald-800 bg-emerald-50' },
  logout: { label: 'Logged out', icon: LogOut, tone: 'text-slate-700 bg-slate-100' },
  login_failed: { label: 'Failed login attempt', icon: ShieldAlert, tone: 'text-red-800 bg-red-50' },
};

// SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC.
const when = (s) => new Date(`${s.replace(' ', 'T')}Z`).toLocaleString();
const device = (ua) => (/Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : ua ? 'Desktop' : '');

export default function AccountPage() {
  const { user } = useAuth();
  const results = useFetch(() => api.myResults());
  const history = useFetch(() => api.loginHistory());

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{user.name}</h1>
      <p className="mt-1 text-slate-600">{user.email}</p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">Your test results</h2>
        {results.loading && <LoadingState label="Loading results…" />}
        {results.error && <ErrorState error={results.error} onRetry={results.reload} title="Couldn't load results" />}
        {results.data && results.data.results.length === 0 && <p className="mt-3 text-slate-600">No tests taken yet. <Link to="/#tests" className="font-semibold text-indigo-800 hover:underline">Start a mock test</Link>.</p>}
        {results.data && results.data.results.length > 0 && (
          <ul className="mt-4 space-y-3">
            {results.data.results.map((r) => (
              <li key={r.attemptId}>
                <Link to={`/result/${r.attemptId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300">
                  <div>
                    <p className="font-semibold text-slate-900">{r.testTitle}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {when(r.submittedAt)} · ✔ {r.correct} · ✘ {r.wrong} · – {r.unanswered} · <Clock size={12} className="inline" /> {formatDuration(r.timeTaken)}
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums text-indigo-800">{formatMarks(r.score)}<span className="text-base font-semibold text-slate-500"> / {formatMarks(r.maxScore)}</span></p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><History size={20} /> Login &amp; signup history</h2>
        {history.loading && <LoadingState label="Loading history…" />}
        {history.error && <ErrorState error={history.error} onRetry={history.reload} title="Couldn't load history" />}
        {history.data && (
          <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {history.data.history.map((h) => {
              const e = EVENTS[h.event];
              const Icon = e.icon;
              return (
                <li key={h.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${e.tone}`}><Icon size={14} /> {e.label}</span>
                  <span className="text-slate-800">{when(h.at)}</span>
                  <span className="text-xs text-slate-600">{[device(h.userAgent), h.ip].filter(Boolean).join(' · ')}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
