import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardCheck, Clock, ListChecks, MinusCircle, Play, Target, Zap } from 'lucide-react';
import Button from '../components/Button.jsx';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import { clearSession, createSession, loadSession, saveSession } from '../utils/sessionStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMarks } from '../utils/format.js';

const MODES = [
  { value: 'exam', icon: ClipboardCheck, title: 'Exam mode', text: 'Answers are marked after you submit. You can change answers freely.' },
  { value: 'practice', icon: Zap, title: 'Practice mode', text: 'Each answer is marked instantly with an explanation. Answers lock once checked.' },
];

export default function InstructionsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(() => api.getTest(testId), [testId]);
  const { user } = useAuth();
  const [mode, setMode] = useState('exam');
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const unfinished = loadSession();

  if (loading) return <LoadingState label="Loading test…" />;
  if (error) return <ErrorState error={error} onRetry={reload} title={error.status === 404 ? 'Test not found' : "Couldn't load this test"} />;

  const { test, questions } = data;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const isMock = test.category === 'mock';
  const canStart = agreed && !starting;

  async function startTest(e) {
    e.preventDefault();
    if (!canStart) return;
    setStarting(true);
    setStartError('');
    try {
      const { attempt, serverNow } = await api.startAttempt({ testId: test.id, mode: isMock ? 'exam' : mode });
      saveSession(createSession({ attempt, serverNow, testTitle: test.title }));
      navigate('/exam');
    } catch (err) {
      setStartError(err.message);
      setStarting(false);
    }
  }

  const details = [
    [ListChecks, 'Questions', questions.length],
    [Clock, 'Duration', `${test.durationMinutes} minutes`],
    [Target, 'Total marks', formatMarks(totalMarks)],
    [Target, 'Marks per question', formatMarks(test.marksPerQuestion)],
    [MinusCircle, 'Negative marking', test.negativeMarking ? `Yes (−${formatMarks(test.negativeMarks)} per wrong answer)` : 'No'],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to="/" className="text-sm font-medium text-indigo-800 hover:underline">← All tests</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{test.title}</h1>
      <p className="mt-2 text-slate-600">{test.description}</p>

      {unfinished && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>You have an unfinished test: <strong>{unfinished.testTitle}</strong>. Starting a new test will discard it.</p>
          <div className="flex gap-2">
            <Button as={Link} to="/exam" size="sm">Resume</Button>
            <Button variant="secondary" size="sm" onClick={() => { clearSession(); reload(); }}>Discard</Button>
          </div>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        {details.map(([Icon, label, value]) => (
          <div key={label} className="flex items-center gap-3 bg-white p-4">
            <Icon size={18} className="shrink-0 text-indigo-700" />
            <div>
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="font-semibold text-slate-900">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Instructions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          <li>The timer starts as soon as you press <strong>Start Test</strong> and does not pause. It keeps running if you refresh the page.</li>
          <li>Pick one option per question. Your answer is saved immediately and stays selected when you move between questions.</li>
          <li>Use <strong>Mark for review</strong> to flag questions you want to revisit, and the question palette to jump anywhere.</li>
          <li>The time you spend on each question is tracked (only while this tab is open and visible) and shown in your result, along with your total time.</li>
          <li>When the timer reaches zero the test is submitted automatically.</li>
          <li>The header shows both the time <strong>left</strong> and the time <strong>elapsed</strong>.</li>
          <li>After submitting you will see your total time taken, correct, wrong and unattempted counts, your final score and the correct answer to every question.</li>
          {test.negativeMarking && <li>Marking: <strong>+{formatMarks(test.marksPerQuestion)}</strong> for each correct answer, <strong>−{formatMarks(test.negativeMarks)}</strong> for each wrong answer, <strong>0</strong> for unattempted questions.</li>}
        </ul>
      </section>

      <form onSubmit={startTest} className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-slate-700">Taking this test as <strong>{user.name}</strong> ({user.email}). Your result will be saved to your account.</p>

        {!isMock && (
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">Choose a mode</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {MODES.map(({ value, icon: Icon, title, text }) => (
              <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 ${mode === value ? 'border-indigo-700 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 h-4 w-4 accent-indigo-700" />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900"><Icon size={16} /> {title}</span>
                  <span className="mt-1 block text-sm text-slate-600">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-700" />
          I have read and understood the instructions.
        </label>

        {startError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{startError}</p>}

        <Button type="submit" size="lg" disabled={!canStart} className="w-full sm:w-auto">
          <Play size={18} /> {starting ? 'Starting…' : 'Start Test'}
        </Button>
      </form>
    </div>
  );
}
