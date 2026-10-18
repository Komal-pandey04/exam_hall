import { testModel } from '../models/testModel.js';
import { questionModel } from '../models/questionModel.js';
import { attemptModel } from '../models/attemptModel.js';
import { resultModel } from '../models/resultModel.js';
import { calculateResult, sanitizeAnswers, sanitizeTimes } from '../utils/scoring.js';
import { notFound } from '../utils/httpError.js';
import { badRequest } from '../utils/httpError.js';

/**
 * POST /api/results – idempotent. Submitting the same attempt twice
 * (double click, retry after a network error) returns the stored result.
 */
export const submitResult = (req, res) => {
  const { attemptId, answers, timeSpent, autoSubmitted } = req.body ?? {};
  if (typeof attemptId !== 'string' || !attemptId) throw badRequest('attemptId is required.');

  const attempt = attemptModel.findById(attemptId);
  if (!attempt || attempt.userId !== req.user.id) throw notFound('Attempt');

  const existing = resultModel.findByAttempt(attemptId);
  if (existing) return res.json({ result: existing, duplicate: true });

  const test = testModel.findById(attempt.testId);
  if (!test) throw notFound('Test');
  const questions = questionModel.listByTest(test.id, test);

  const cleanAnswers = sanitizeAnswers(questions, answers);
  const cleanTimes = sanitizeTimes(questions, timeSpent, test.durationMinutes * 60 + 60);
  const calc = calculateResult(questions, cleanAnswers, { negativeMarking: test.negativeMarking, negativeMarks: test.negativeMarks });

  const byId = new Map(questions.map((q) => [q.id, q]));
  const review = calc.details.map((d) => {
    const q = byId.get(d.questionId);
    return {
      questionId: q.id,
      position: q.position,
      question: q.question,
      options: q.options,
      imageUrl: q.imageUrl,
      source: q.source,
      marks: q.marks,
      selectedIndex: d.selectedIndex,
      correctIndex: q.correctIndex,
      status: d.status,
      awarded: d.awarded,
      timeSpent: cleanTimes[q.id] ?? 0,
      explanation: q.explanation,
    };
  });

  // Never count more time than the test allows.
  const finishedAt = Math.min(Date.now(), attempt.endsAt);
  const timeTaken = Math.max(0, Math.round((finishedAt - attempt.startedAt) / 1000));

  const result = resultModel.save(attempt, test, calc, {
    answers: cleanAnswers,
    review,
    timeTaken,
    autoSubmitted: Boolean(autoSubmitted),
  });
  res.status(201).json({ result, duplicate: false });
};

export const getResult = (req, res) => {
  const result = resultModel.findByAttempt(req.params.attemptId);
  if (!result || result.userId !== req.user.id) throw notFound('Result');
  res.json({ result });
};

/** The signed-in user's saved results (summary only, newest first). */
export const listMyResults = (req, res) => res.json({ results: resultModel.listByUser(req.user.id) });
