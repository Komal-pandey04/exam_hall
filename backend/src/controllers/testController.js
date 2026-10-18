import { testModel } from '../models/testModel.js';
import { questionModel, toPublicQuestion } from '../models/questionModel.js';
import { notFound, HttpError } from '../utils/httpError.js';
import { parseId, validateTestBody } from '../middleware/validate.js';

export const listTests = (req, res) => {
  res.json({ tests: testModel.list({ includeInactive: req.query.all === '1' && req.isAdmin }).filter((t) => t.questionCount > 0 || req.isAdmin) });
};

export const getStats = (req, res) => res.json(testModel.stats());

/** Student-facing: test details + questions WITHOUT answers. */
export const getTest = (req, res) => {
  const test = testModel.findById(parseId(req.params.id, 'test id'));
  if (!test || !test.isActive) throw notFound('Test');
  const questions = questionModel.listByTest(test.id, test);
  if (questions.length === 0) throw new HttpError(409, 'This test has no questions yet. Please check back later.');
  res.json({ test, questions: questions.map(toPublicQuestion) });
};

export const createTest = (req, res) => {
  const body = validateTestBody(req.body ?? {});
  res.status(201).json({ test: testModel.create(body) });
};

export const updateTest = (req, res) => {
  const id = parseId(req.params.id, 'test id');
  const test = testModel.update(id, validateTestBody(req.body ?? {}, { partial: true }));
  if (!test) throw notFound('Test');
  res.json({ test });
};

export const deleteTest = (req, res) => {
  if (!testModel.remove(parseId(req.params.id, 'test id'))) throw notFound('Test');
  res.status(204).end();
};
