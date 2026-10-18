import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useBlocker, useNavigate } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import Button from '../components/Button.jsx';
import ConfirmSubmitModal from '../components/ConfirmSubmitModal.jsx';
import ExamHeader from '../components/ExamHeader.jsx';
import Modal from '../components/Modal.jsx';
import PaletteDrawer from '../components/PaletteDrawer.jsx';
import PalettePanel from '../components/PalettePanel.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import QuestionNav from '../components/QuestionNav.jsx';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { useExamSession } from '../hooks/useExamSession.js';
import { useFetch } from '../hooks/useFetch.js';
import { useQuestionTimer } from '../hooks/useQuestionTimer.js';
import { useSubmit } from '../hooks/useSubmit.js';
import { api } from '../services/api.js';
import { summarize } from '../utils/palette.js';
import { clearSession, loadSession } from '../utils/sessionStorage.js';

/** Loads the saved session + test data, validates the attempt, then mounts the runner. */
export default function ExamPage() {
  const stored = useMemo(() => loadSession(), []);
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(async () => {
    if (!stored) return null;
    const [testData, attemptData] = await Promise.all([api.getTest(stored.testId), api.getAttempt(stored.attemptId)]);
    return { testData, attempt: attemptData.attempt };
  }, [stored?.attemptId]);

  useEffect(() => {
    // Already submitted (e.g. from another tab) -> go straight to the result.
    if (data?.attempt?.status === 'submitted') {
      clearSession();
      navigate(`/result/${data.attempt.id}`, { replace: true });
    }
  }, [data, navigate]);

  if (!stored) return <Navigate to="/" replace />;
  if (loading) return <LoadingState label="Restoring your test…" />;
  if (error) {
    const gone = error.status === 404;
    return (
      <div className="grid min-h-screen place-items-center">
        <ErrorState
          error={gone ? { message: 'This test attempt no longer exists on the server.' } : error}
          title={gone ? 'Attempt not found' : "Couldn't load your test"}
          onRetry={gone ? () => { clearSession(); navigate('/', { replace: true }); } : reload}
        />
      </div>
    );
  }
  if (!data || data.attempt.status === 'submitted') return <LoadingState label="Opening your result…" />;

  return <ExamRunner test={data.testData.test} questions={data.testData.questions} />;
}

function ExamRunner({ test, questions }) {
  const navigate = useNavigate();
  const [session, dispatch] = useExamSession(questions);
  const sessionRef = useRef(session);
  const timerRef = useRef(null);
  const allowLeave = useRef(false);
  const warned = useRef({ five: false, one: false });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    sessionRef.current = session;
    timerRef.current = qTimer;
  });

  const question = questions[session.current];
  const qTimer = useQuestionTimer({ questionId: question.id, timeSpent: session.timeSpent, dispatch });

  // ---- submission ----
  const handleSuccess = useCallback(
    (result) => {
      allowLeave.current = true;
      clearSession();
      navigate(`/result/${result.attemptId}`, { replace: true, state: { result } });
    },
    [navigate]
  );
  const { submit, reset, status, message } = useSubmit(handleSuccess);
  const submitting = status === 'submitting';

  const doSubmit = useCallback(
    (auto) => {
      const s = sessionRef.current;
      setConfirmOpen(false);
      submit({ attemptId: s.attemptId, answers: s.answers, timeSpent: timerRef.current.getSeconds(), autoSubmitted: auto });
    },
    [submit]
  );

  // ---- timer ----
  const remaining = useCountdown(session.endTime, () => doSubmit(true));
  const timeUp = remaining <= 0;
  const totalSeconds = session.startTime ? Math.round((session.endTime - session.startTime) / 1000) : null;
  const elapsed = totalSeconds === null ? null : Math.min(totalSeconds, Math.max(0, totalSeconds - remaining));

  useEffect(() => {
    if (remaining > 0 && remaining <= 60 && !warned.current.one) {
      warned.current = { five: true, one: true };
      setBanner({ tone: 'danger', text: 'Only 1 minute remaining! Your test will be submitted automatically at 00:00.' });
    } else if (remaining > 60 && remaining <= 300 && !warned.current.five) {
      warned.current.five = true;
      setBanner({ tone: 'warn', text: '5 minutes remaining. Review your marked questions.' });
    }
  }, [remaining]);

  useEffect(() => {
    if (!banner) return undefined;
    const id = setTimeout(() => setBanner(null), 8000);
    return () => clearTimeout(id);
  }, [banner]);

  // ---- leaving the page ----
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowLeave.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
      setBanner({ tone: 'warn', text: 'Going back is disabled during the test. Use "Submit Test" to finish.' });
    }
  }, [blocker]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (allowLeave.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // ---- navigation & answers ----
  const total = questions.length;
  const summary = summarize(questions, session);
  const isPractice = session.mode === 'practice';
  const feedback = session.feedback[question.id];

  useEffect(() => {
    dispatch({ type: 'VISIT', questionId: question.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback(
    (index) => {
      if (index < 0 || index >= total) return;
      qTimer.flush(); // credit the time to the question we are leaving
      dispatch({ type: 'GO_TO', index, questionId: questions[index].id });
      setPaletteOpen(false);
      window.scrollTo({ top: 0 });
    },
    [dispatch, questions, total, qTimer]
  );

  async function selectOption(index) {
    if (feedback || checking) return;
    dispatch({ type: 'ANSWER', questionId: question.id, index });
    if (!isPractice) return;
    setChecking(true);
    try {
      const res = await api.checkAnswer(question.id, session.attemptId, index);
      dispatch({ type: 'FEEDBACK', questionId: question.id, feedback: { selectedIndex: index, correctIndex: res.correctIndex, isCorrect: res.isCorrect, explanation: res.explanation } });
    } catch (err) {
      setBanner({ tone: 'warn', text: `Couldn't mark that answer yet: ${err.message} Your selection is saved — tap an option again to retry.` });
    } finally {
      setChecking(false);
    }
  }

  const tally = useMemo(() => {
    const items = Object.values(session.feedback);
    return { checked: items.length, correct: items.filter((f) => f.isCorrect).length };
  }, [session.feedback]);

  const bannerTone = { warn: 'bg-amber-50 text-amber-900 border-amber-300', danger: 'bg-red-50 text-red-800 border-red-300' };

  return (
    <div className="min-h-screen bg-slate-50">
      <ExamHeader
        title={test.title}
        mode={session.mode}
        current={session.current + 1}
        total={total}
        answered={summary.answered}
        seconds={remaining}
        elapsed={elapsed}
        tally={tally}
        submitting={submitting}
        onOpenPalette={() => setPaletteOpen(true)}
        onSubmit={() => setConfirmOpen(true)}
      />

      <div aria-live="polite" className="mx-auto max-w-7xl px-3 sm:px-6">
        {banner && <p role="status" className={`mt-3 rounded-lg border px-4 py-2.5 text-sm font-medium ${bannerTone[banner.tone]}`}>{banner.text}</p>}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-3 py-4 pb-40 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <QuestionCard
            question={question}
            number={session.current + 1}
            total={total}
            selectedIndex={session.answers[question.id]}
            onSelect={selectOption}
            feedback={feedback}
            marked={Boolean(session.marked[question.id])}
            disabled={checking || timeUp}
            timeOnQuestion={qTimer.currentSeconds}
          />
          <QuestionNav
            isFirst={session.current === 0}
            isLast={session.current === total - 1}
            marked={Boolean(session.marked[question.id])}
            hasAnswer={session.answers[question.id] !== undefined}
            canClear={!isPractice}
            onPrev={() => goTo(session.current - 1)}
            onNext={() => goTo(session.current + 1)}
            onToggleMark={() => dispatch({ type: 'TOGGLE_MARK', questionId: question.id })}
            onClear={() => dispatch({ type: 'CLEAR_ANSWER', questionId: question.id })}
          />
        </div>

        <aside className="hidden lg:block" aria-label="Question palette">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <PalettePanel questions={questions} session={session} summary={summary} onJump={goTo} />
            <Button onClick={() => setConfirmOpen(true)} disabled={submitting} className="mt-5 w-full">
              <Send size={16} /> Submit Test
            </Button>
          </div>
        </aside>
      </div>

      <PaletteDrawer open={paletteOpen} onClose={() => setPaletteOpen(false)}>
        <PalettePanel questions={questions} session={session} summary={summary} onJump={goTo} />
        <Button onClick={() => { setPaletteOpen(false); setConfirmOpen(true); }} className="mt-5 w-full">
          <Send size={16} /> Submit Test
        </Button>
      </PaletteDrawer>

      {confirmOpen && !timeUp && (
        <ConfirmSubmitModal summary={summary} submitting={submitting} onContinue={() => setConfirmOpen(false)} onSubmit={() => doSubmit(false)} />
      )}

      {status === 'error' && (
        <Modal
          title="Submission failed"
          dismissible={!timeUp}
          onClose={reset}
          footer={
            <>
              {!timeUp && <Button variant="secondary" onClick={reset}>Keep working</Button>}
              <Button onClick={() => { reset(); doSubmit(timeUp); }}>Try again</Button>
            </>
          }
        >
          <p role="alert">{message}</p>
          <p className="mt-2">Your answers are saved on this device — nothing is lost.</p>
        </Modal>
      )}

      {timeUp && status !== 'error' && (
        <div role="alertdialog" aria-label="Time is up" className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-xl">
            <Loader2 className="animate-spin text-indigo-700" size={32} />
            <h2 className="text-lg font-bold text-slate-900">Time is up!</h2>
            <p className="text-sm text-slate-600">Submitting your test automatically…</p>
          </div>
        </div>
      )}
    </div>
  );
}
