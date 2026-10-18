import { badRequest } from '../utils/httpError.js';

const isText = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isNum = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function parseId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label}.`);
  return id;
}

export function validateQuestionBody(body, { partial = false } = {}) {
  const out = {};
  const need = (key) => !partial || body[key] !== undefined;

  if (need('question')) {
    if (!isText(body.question, 3, 2000)) throw badRequest('Question text must be 3-2000 characters.');
    out.question = body.question.trim();
  }
  if (need('options')) {
    const ok = Array.isArray(body.options) && body.options.length >= 2 && body.options.length <= 6 && body.options.every((o) => isText(o, 1, 500));
    if (!ok) throw badRequest('Provide 2-6 options, each 1-500 characters.');
    out.options = body.options.map((o) => o.trim());
  }
  if (need('correctIndex')) {
    const optionCount = (out.options || body.options || []).length || 6;
    if (!Number.isInteger(body.correctIndex) || body.correctIndex < 0 || body.correctIndex >= optionCount) {
      throw badRequest('correctIndex must point at one of the options.');
    }
    out.correctIndex = body.correctIndex;
  }
  if (body.explanation !== undefined) {
    if (typeof body.explanation !== 'string' || body.explanation.length > 4000) throw badRequest('Explanation must be text up to 4000 characters.');
    out.explanation = body.explanation.trim();
  }
  if (body.source !== undefined) {
    if (typeof body.source !== 'string' || body.source.length > 200) throw badRequest('Source must be text up to 200 characters.');
    out.source = body.source.trim();
  }
  if (body.imageUrl !== undefined && body.imageUrl !== null && body.imageUrl !== '') {
    if (typeof body.imageUrl !== 'string' || !/^https?:\/\//i.test(body.imageUrl) || body.imageUrl.length > 1000) {
      throw badRequest('Image URL must start with http:// or https://.');
    }
    out.imageUrl = body.imageUrl;
  } else if (body.imageUrl !== undefined) out.imageUrl = null;
  if (body.marks !== undefined && body.marks !== null && body.marks !== '') {
    if (!isNum(body.marks, 0, 100)) throw badRequest('Marks must be a number between 0 and 100.');
    out.marks = body.marks;
  } else if (body.marks !== undefined) out.marks = null;
  if (body.testId !== undefined) out.testId = parseId(body.testId, 'testId');
  if (!partial && out.testId === undefined) throw badRequest('testId is required.');
  return out;
}

export function validateTestBody(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.title !== undefined) {
    if (!isText(body.title, 3, 200)) throw badRequest('Title must be 3-200 characters.');
    out.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.length > 1000) throw badRequest('Description must be text up to 1000 characters.');
    out.description = body.description.trim();
  }
  if (!partial || body.durationMinutes !== undefined) {
    if (!Number.isInteger(body.durationMinutes) || body.durationMinutes < 1 || body.durationMinutes > 600) throw badRequest('Duration must be a whole number of minutes (1-600).');
    out.durationMinutes = body.durationMinutes;
  }
  if (!partial || body.marksPerQuestion !== undefined) {
    if (!isNum(body.marksPerQuestion, 0.25, 100)) throw badRequest('Marks per question must be between 0.25 and 100.');
    out.marksPerQuestion = body.marksPerQuestion;
  }
  if (!partial || body.negativeMarking !== undefined) {
    if (typeof body.negativeMarking !== 'boolean') throw badRequest('negativeMarking must be true or false.');
    out.negativeMarking = body.negativeMarking;
  }
  if (body.negativeMarks !== undefined) {
    if (!isNum(body.negativeMarks, 0, 100)) throw badRequest('Negative marks must be between 0 and 100.');
    out.negativeMarks = body.negativeMarks;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw badRequest('isActive must be true or false.');
    out.isActive = body.isActive;
  }
  return out;
}

export function validateAttemptBody(body) {
  if (!['exam', 'practice'].includes(body.mode)) throw badRequest('Mode must be "exam" or "practice".');
  return { testId: parseId(body.testId, 'testId'), mode: body.mode };
}
