import { testModel } from '../models/testModel.js';
import { questionModel } from '../models/questionModel.js';
import { attemptModel } from '../models/attemptModel.js';
import { notFound, badRequest, HttpError } from '../utils/httpError.js';
import { parseId, validateQuestionBody } from '../middleware/validate.js';

// ---------- Admin CRUD (includes correct answers) ----------

export const listQuestions = async (req, res) => {
  const testId = parseId(req.query.testId, 'testId');
  const test = await testModel.findById(testId);
  if (!test) throw notFound('Test');
  res.json({ test, questions: await questionModel.listByTest(testId, test) });
};

export const getQuestion = async (req, res) => {
  const question = await questionModel.findById(parseId(req.params.id, 'question id'));
  if (!question) throw notFound('Question');
  res.json({ question });
};

export const createQuestion = async (req, res) => {
  const data = validateQuestionBody(req.body ?? {});
  const test = await testModel.findById(data.testId);
  if (!test) throw notFound('Test');
  const created = await questionModel.create(data);
  res.status(201).json({ question: await questionModel.findById(created.id, test) });
};

export const updateQuestion = async (req, res) => {
  const id = parseId(req.params.id, 'question id');
  const data = validateQuestionBody(req.body ?? {}, { partial: true });
  delete data.testId;
  const result = await questionModel.update(id, data);
  if (!result) throw notFound('Question');
  if (result.error) throw badRequest(result.error);
  res.json({ question: result });
};

export const deleteQuestion = async (req, res) => {
  if (!(await questionModel.remove(parseId(req.params.id, 'question id')))) throw notFound('Question');
  res.status(204).end();
};

// ---------- Practice mode: instant marking ----------

/** POST /api/questions/:id/check – only allowed for an open PRACTICE attempt. */
export const checkAnswer = async (req, res) => {
  const id = parseId(req.params.id, 'question id');
  const { attemptId, selectedIndex } = req.body ?? {};
  const attempt = typeof attemptId === 'string' ? await attemptModel.findById(attemptId) : null;
  if (!attempt) throw notFound('Attempt');
  if (attempt.mode !== 'practice') throw new HttpError(403, 'Instant answer checking is only available in practice mode.');
  if (attempt.status !== 'in_progress') throw new HttpError(409, 'This attempt has already been submitted.');

  const question = await questionModel.findById(id);
  if (!question || question.testId !== attempt.testId) throw notFound('Question');
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) throw badRequest('Invalid option selected.');

  res.json({
    questionId: question.id,
    selectedIndex,
    correctIndex: question.correctIndex,
    isCorrect: selectedIndex === question.correctIndex,
    explanation: question.explanation,
  });
};
