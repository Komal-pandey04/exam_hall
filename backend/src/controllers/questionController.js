import { testModel } from '../models/testModel.js';
import { questionModel } from '../models/questionModel.js';
import { attemptModel } from '../models/attemptModel.js';
import { notFound, badRequest, HttpError } from '../utils/httpError.js';
import { parseId, validateQuestionBody } from '../middleware/validate.js';

// ---------- Admin CRUD (includes correct answers) ----------

export const listQuestions = (req, res) => {
  const testId = parseId(req.query.testId, 'testId');
  const test = testModel.findById(testId);
  if (!test) throw notFound('Test');
  res.json({ test, questions: questionModel.listByTest(testId, test) });
};

export const getQuestion = (req, res) => {
  const question = questionModel.findById(parseId(req.params.id, 'question id'));
  if (!question) throw notFound('Question');
  res.json({ question });
};

export const createQuestion = (req, res) => {
  const data = validateQuestionBody(req.body ?? {});
  const test = testModel.findById(data.testId);
  if (!test) throw notFound('Test');
  const created = questionModel.create(data);
  res.status(201).json({ question: questionModel.findById(created.id, test) });
};

export const updateQuestion = (req, res) => {
  const id = parseId(req.params.id, 'question id');
  const data = validateQuestionBody(req.body ?? {}, { partial: true });
  delete data.testId;
  const result = questionModel.update(id, data);
  if (!result) throw notFound('Question');
  if (result.error) throw badRequest(result.error);
  res.json({ question: result });
};

export const deleteQuestion = (req, res) => {
  if (!questionModel.remove(parseId(req.params.id, 'question id'))) throw notFound('Question');
  res.status(204).end();
};

// ---------- Practice mode: instant marking ----------

/** POST /api/questions/:id/check – only allowed for an open PRACTICE attempt. */
export const checkAnswer = (req, res) => {
  const id = parseId(req.params.id, 'question id');
  const { attemptId, selectedIndex } = req.body ?? {};
  const attempt = typeof attemptId === 'string' ? attemptModel.findById(attemptId) : null;
  if (!attempt) throw notFound('Attempt');
  if (attempt.mode !== 'practice') throw new HttpError(403, 'Instant answer checking is only available in practice mode.');
  if (attempt.status !== 'in_progress') throw new HttpError(409, 'This attempt has already been submitted.');

  const question = questionModel.findById(id);
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
