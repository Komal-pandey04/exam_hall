import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestionStatus, summarize } from './palette.js';
import { formatClock } from './format.js';

const base = { answers: {}, marked: {}, visited: {} };

test('palette status covers all five states', () => {
  assert.equal(getQuestionStatus(1, base), 'unvisited');
  assert.equal(getQuestionStatus(1, { ...base, visited: { 1: true } }), 'notAnswered');
  assert.equal(getQuestionStatus(1, { ...base, answers: { 1: 0 }, visited: { 1: true } }), 'answered');
  assert.equal(getQuestionStatus(1, { ...base, marked: { 1: true } }), 'marked');
  assert.equal(getQuestionStatus(1, { ...base, answers: { 1: 2 }, marked: { 1: true } }), 'answeredMarked');
});

test('option index 0 counts as answered', () => {
  assert.equal(getQuestionStatus(5, { ...base, answers: { 5: 0 } }), 'answered');
});

test('summarize counts answered, unanswered and marked', () => {
  const qs = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const s = summarize(qs, { answers: { 1: 0, 3: 2 }, marked: { 2: true, 3: true }, visited: {} });
  assert.deepEqual(s, { total: 3, answered: 2, unanswered: 1, marked: 2 });
});

test('formatClock', () => {
  assert.equal(formatClock(1799), '29:59');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatClock(-4), '00:00');
});
