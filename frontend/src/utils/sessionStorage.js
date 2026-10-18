// The running exam is mirrored to localStorage so a refresh, crash or accidental
// tab close never loses answers – and never restarts the clock (endTime is absolute).
const KEY = 'examhall.session.v1';

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.attemptId && s.testId && Number.isFinite(s.endTime) ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full or blocked – the exam keeps working in memory */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Build a brand-new session from the server's start-attempt response.
 * endTime is converted to THIS device's clock so a wrong local clock can't shorten/extend the test.
 */
export function createSession({ attempt, serverNow, testTitle }) {
  const clockOffset = serverNow - Date.now();
  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testTitle,
    studentName: attempt.studentName,
    mode: attempt.mode,
    startTime: attempt.startedAt - clockOffset,
    endTime: attempt.endsAt - clockOffset,
    answers: {},
    visited: {},
    marked: {},
    feedback: {},
    timeSpent: {}, // questionId -> milliseconds
    current: 0,
  };
}
