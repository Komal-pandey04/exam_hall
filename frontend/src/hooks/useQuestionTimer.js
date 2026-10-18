import { useCallback, useEffect, useRef } from 'react';
import { loadSession, saveSession } from '../utils/sessionStorage.js';

const FLUSH_EVERY_MS = 5000;

/**
 * Tracks how long the student spends on each question.
 *  - Time is only counted while the tab is visible (switching tabs pauses it).
 *  - It is added to the saved session on every question change, tab hide and every 5s,
 *    so a refresh loses at most a few seconds.
 *  - `getSeconds()` returns saved + not-yet-saved time, for display and for submission.
 */
export function useQuestionTimer({ questionId, timeSpent, dispatch }) {
  const visible = () => document.visibilityState === 'visible';
  const startedAt = useRef(visible() ? Date.now() : null);
  const idRef = useRef(questionId);
  const savedRef = useRef(timeSpent || {});

  useEffect(() => {
    idRef.current = questionId;
    savedRef.current = timeSpent || {};
  });

  /** Move the pending time into session state. Call BEFORE changing the current question. */
  const flush = useCallback(() => {
    if (startedAt.current === null) return;
    const now = Date.now();
    const ms = now - startedAt.current;
    startedAt.current = visible() ? now : null;
    if (ms > 0) dispatch({ type: 'ADD_TIME', questionId: idRef.current, ms });
  }, [dispatch]);

  useEffect(() => {
    const onVisibility = () => {
      if (visible()) {
        if (startedAt.current === null) startedAt.current = Date.now();
      } else {
        flush();
        startedAt.current = null;
      }
    };
    // The page is going away (refresh / close): write straight to storage, React won't get another render.
    const onPageHide = () => {
      if (startedAt.current === null) return;
      const ms = Date.now() - startedAt.current;
      startedAt.current = null;
      const stored = loadSession();
      if (!stored || ms <= 0) return;
      const times = stored.timeSpent || {};
      saveSession({ ...stored, timeSpent: { ...times, [idRef.current]: (times[idRef.current] || 0) + ms } });
    };
    const id = setInterval(flush, FLUSH_EVERY_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flush]);

  const pending = () => (startedAt.current === null ? 0 : Date.now() - startedAt.current);

  /** Seconds on the question being viewed, computed from this render's props so it never lags a question behind. */
  const currentSeconds = Math.floor((((timeSpent || {})[questionId] || 0) + pending()) / 1000);

  /** { questionId: seconds } for every question, including time not yet flushed. */
  const getSeconds = () => {
    const out = {};
    const all = { ...savedRef.current };
    all[idRef.current] = (all[idRef.current] || 0) + pending();
    for (const [id, ms] of Object.entries(all)) out[id] = Math.round(ms / 1000);
    return out;
  };

  return { flush, currentSeconds, getSeconds };
}
