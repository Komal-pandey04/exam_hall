import { testModel } from '../models/testModel.js';
import { questionModel, toPublicQuestion } from '../models/questionModel.js';
import { notFound, HttpError } from '../utils/httpError.js';
import { parseId, validateTestBody } from '../middleware/validate.js';

export const listTests = async (req, res) => {
  const tests = await testModel.list({ includeInactive: req.query.all === '1' && req.isAdmin });
  res.json({ tests: tests.filter((t) => t.questionCount > 0 || req.isAdmin) });
};

export const getStats = async (req, res) => res.json(await testModel.stats());

/** Student-facing: test details + questions WITHOUT answers. */
export const getTest = async (req, res) => {
  const test = await testModel.findById(parseId(req.params.id, 'test id'));
  if (!test || !test.isActive) throw notFound('Test');
  const questions = await questionModel.listByTest(test.id, test);
  if (questions.length === 0) throw new HttpError(409, 'This test has no questions yet. Please check back later.');
  res.json({ test, questions: questions.map(toPublicQuestion) });
};

export const createTest = async (req, res) => {
  const body = validateTestBody(req.body ?? {});
  res.status(201).json({ test: await testModel.create(body) });
};

export const updateTest = async (req, res) => {
  const id = parseId(req.params.id, 'test id');
  const test = await testModel.update(id, validateTestBody(req.body ?? {}, { partial: true }));
  if (!test) throw notFound('Test');
  res.json({ test });
};

export const deleteTest = async (req, res) => {
  if (!(await testModel.remove(parseId(req.params.id, 'test id')))) throw notFound('Test');
  res.status(204).end();
};
