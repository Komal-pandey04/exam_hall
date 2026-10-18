import { useEffect, useReducer } from 'react';
import { loadSession, saveSession } from '../utils/sessionStorage.js';

function reducer(state, action) {
  switch (action.type) {
    case 'ANSWER':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.index } };
    case 'CLEAR_ANSWER': {
      const { [action.questionId]: _removed, ...rest } = state.answers;
      return { ...state, answers: rest };
    }
    case 'TOGGLE_MARK': {
      const marked = { ...state.marked };
      if (marked[action.questionId]) delete marked[action.questionId];
      else marked[action.questionId] = true;
      return { ...state, marked };
    }
    case 'FEEDBACK':
      return { ...state, feedback: { ...state.feedback, [action.questionId]: action.feedback } };
    case 'GO_TO':
      return {
        ...state,
        current: action.index,
        visited: { ...state.visited, [action.questionId]: true },
      };
    case 'ADD_TIME': {
      const times = state.timeSpent || {};
      return { ...state, timeSpent: { ...times, [action.questionId]: (times[action.questionId] || 0) + action.ms } };
    }
    case 'VISIT':
      return { ...state, visited: { ...state.visited, [action.questionId]: true } };
    default:
      return state;
  }
}

/**
 * Exam state (answers, review marks, visited flags, current question).
 * Starts from whatever was saved, and writes every change back to localStorage.
 */
export function useExamSession(questions) {
  const [session, dispatch] = useReducer(reducer, null, () => {
    const saved = loadSession();
    if (!saved) return null;
    const lastIndex = Math.max(0, questions.length - 1);
    return { ...saved, current: Math.min(Math.max(saved.current || 0, 0), lastIndex) };
  });

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  return [session, dispatch];
}
