/**
 * Pure result calculation – shared by the API and the unit tests.
 *
 * @param {Array<{id:number, correctIndex:number, marks:number}>} questions
 * @param {Record<string, number>} answers   questionId -> chosen option index
 * @param {{negativeMarking:boolean, negativeMarks:number}} rules
 */
export function calculateResult(questions, answers, rules) {
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  const details = questions.map((q) => {
    maxScore += q.marks;
    const chosen = answers[q.id];
    const hasAnswer = Number.isInteger(chosen) && chosen >= 0;

    let status = 'unanswered';
    let awarded = 0;
    if (hasAnswer && chosen === q.correctIndex) {
      status = 'correct';
      awarded = q.marks;
      correct += 1;
    } else if (hasAnswer) {
      status = 'wrong';
      awarded = rules.negativeMarking ? -rules.negativeMarks : 0;
      wrong += 1;
    } else {
      unanswered += 1;
    }
    score += awarded;
    return { questionId: q.id, selectedIndex: hasAnswer ? chosen : null, status, awarded };
  });

  const attempted = correct + wrong;
  return {
    totalQuestions: questions.length,
    attempted,
    correct,
    wrong,
    unanswered,
    score: round2(score),
    maxScore: round2(maxScore),
    percentage: maxScore > 0 ? round2(Math.max(0, (score / maxScore) * 100)) : 0,
    accuracy: attempted > 0 ? round2((correct / attempted) * 100) : 0,
    details,
  };
}

/** Keep only answers that point at real questions and valid option indexes. */
export function sanitizeAnswers(questions, rawAnswers) {
  const clean = {};
  if (!rawAnswers || typeof rawAnswers !== 'object') return clean;
  for (const q of questions) {
    const value = rawAnswers[q.id];
    if (Number.isInteger(value) && value >= 0 && value < q.options.length) clean[q.id] = value;
  }
  return clean;
}

/**
 * Time spent per question, in whole seconds. Unknown questions and invalid values are dropped,
 * and each value is capped so a tampered request can't store absurd numbers.
 */
export function sanitizeTimes(questions, rawTimes, maxSeconds) {
  const clean = {};
  if (!rawTimes || typeof rawTimes !== 'object') return clean;
  for (const q of questions) {
    const value = Number(rawTimes[q.id]);
    if (Number.isFinite(value) && value >= 0) clean[q.id] = Math.min(Math.round(value), maxSeconds);
  }
  return clean;
}

const round2 = (n) => Math.round(n * 100) / 100;
