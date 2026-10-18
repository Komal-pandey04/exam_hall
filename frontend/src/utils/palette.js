/**
 * Question palette states:
 *  unvisited | notAnswered | answered | marked | answeredMarked
 * ("current" is a visual ring layered on top of any state).
 */
export function getQuestionStatus(questionId, { answers, marked, visited }) {
  const isAnswered = answers[questionId] !== undefined;
  const isMarked = Boolean(marked[questionId]);
  if (isAnswered && isMarked) return 'answeredMarked';
  if (isMarked) return 'marked';
  if (isAnswered) return 'answered';
  if (visited[questionId]) return 'notAnswered';
  return 'unvisited';
}

export function summarize(questions, session) {
  let answered = 0;
  let marked = 0;
  for (const q of questions) {
    if (session.answers[q.id] !== undefined) answered += 1;
    if (session.marked[q.id]) marked += 1;
  }
  return { total: questions.length, answered, unanswered: questions.length - answered, marked };
}

export const STATUS_STYLES = {
  unvisited: 'bg-white border-slate-300 text-slate-700',
  notAnswered: 'bg-amber-100 border-amber-500 text-amber-900',
  answered: 'bg-emerald-600 border-emerald-600 text-white',
  marked: 'bg-violet-600 border-violet-600 text-white rounded-full',
  answeredMarked: 'bg-violet-600 border-violet-600 text-white rounded-full',
};

export const STATUS_LABELS = [
  ['unvisited', 'Not visited'],
  ['notAnswered', 'Not answered'],
  ['answered', 'Answered'],
  ['marked', 'Marked for review'],
  ['answeredMarked', 'Answered + marked'],
];
