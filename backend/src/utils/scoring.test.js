import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateResult, sanitizeAnswers, sanitizeTimes } from './scoring.js';

const questions = [
  { id: 1, correctIndex: 1, marks: 1, options: ['a', 'b', 'c', 'd'] },
  { id: 2, correctIndex: 0, marks: 2, options: ['a', 'b', 'c', 'd'] },
  { id: 3, correctIndex: 3, marks: 1, options: ['a', 'b', 'c', 'd'] },
  { id: 4, correctIndex: 2, marks: 1, options: ['a', 'b', 'c', 'd'] },
];

test('scores correct, wrong and unanswered without negative marking', () => {
  const r = calculateResult(questions, { 1: 1, 2: 3, 3: 3 }, { negativeMarking: false, negativeMarks: 0.25 });
  assert.equal(r.correct, 2);
  assert.equal(r.wrong, 1);
  assert.equal(r.unanswered, 1);
  assert.equal(r.score, 2);
  assert.equal(r.maxScore, 5);
  assert.equal(r.percentage, 40);
  assert.equal(r.accuracy, 66.67);
});

test('applies negative marking only to wrong answers', () => {
  const r = calculateResult(questions, { 1: 0, 2: 0 }, { negativeMarking: true, negativeMarks: 0.5 });
  assert.equal(r.score, 1.5);
  assert.equal(r.wrong, 1);
});

test('percentage never goes below zero', () => {
  const r = calculateResult(questions, { 1: 0, 2: 1, 3: 0, 4: 0 }, { negativeMarking: true, negativeMarks: 1 });
  assert.equal(r.percentage, 0);
});

test('sanitizeAnswers drops unknown questions and out-of-range options', () => {
  assert.deepEqual(sanitizeAnswers(questions, { 1: 2, 2: 9, 99: 0, 3: 'x' }), { 1: 2 });
});

test('sanitizeTimes rounds, caps and drops invalid values', () => {
  const out = sanitizeTimes(questions, { 1: 12.4, 2: -5, 3: 99999, 4: 'abc', 77: 3 }, 600);
  assert.deepEqual(out, { 1: 12, 3: 600 });
});
