import { testModel } from '../models/testModel.js';
import { questionModel } from '../models/questionModel.js';
import { attemptModel } from '../models/attemptModel.js';
import { notFound, HttpError } from '../utils/httpError.js';
import { validateAttemptBody } from '../middleware/validate.js';

/** Starts the server-side clock. The client stores endsAt and never restarts it. */
export const startAttempt = (req, res) => {
  const { testId, mode: requestedMode } = validateAttemptBody(req.body ?? {});
  const test = testModel.findById(testId);
  if (!test || !test.isActive) throw notFound('Test');
  if (!questionModel.listByTest(testId, test).length) throw new HttpError(409, 'This test has no questions yet.');

  // Mock tests are always real exams: no answer hints while they run.
  const mode = test.category === 'mock' ? 'exam' : requestedMode;
  const attempt = attemptModel.create({ testId, studentName: req.user.name, userId: req.user.id, mode, durationMinutes: test.durationMinutes });
  res.status(201).json({ attempt, serverNow: Date.now() });
};

/** Used on refresh to confirm an unfinished attempt is still valid. */
export const getAttempt = (req, res) => {
  const attempt = attemptModel.findById(req.params.id);
  if (!attempt || attempt.userId !== req.user.id) throw notFound('Attempt');
  res.json({ attempt, serverNow: Date.now() });
};
