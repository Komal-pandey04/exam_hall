import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'examhall-test-'));
process.env.DB_PATH = path.join(dir, 'test.db');
process.env.CLIENT_URL = 'http://localhost:5173';

const { createApp } = await import('./app.js');
const { seedIfEmpty, seedMockTests } = await import('./db/seed.js');
const { db } = await import('./db/database.js');

let server;
let base;
before(async () => {
  await seedIfEmpty();
  await seedMockTests();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  db.close();
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}
});

const call = async (method, url, body, token) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

test('seeds 25 mock tests with exactly 100 four-option questions each, and is idempotent', async () => {
  assert.equal(await seedMockTests(), 0);
  const { body } = await call('GET', '/tests');
  const mocks = body.tests.filter((t) => t.category === 'mock');
  assert.equal(mocks.length, 25);
  assert.deepEqual(mocks.map((t) => t.title), Array.from({ length: 25 }, (_, i) => `Mock Test ${i + 1}`));
  for (const t of mocks) {
    assert.equal(t.questionCount, 100);
    assert.equal(t.totalMarks, 100);
    assert.equal(t.negativeMarking, true);
    assert.equal(t.negativeMarks, 0.25);
  }
  const rowsRes = await db.execute({
    sql: 'SELECT options FROM questions WHERE test_id IN (SELECT id FROM tests WHERE category = ?)',
    args: ['mock'],
  });
  assert.equal(rowsRes.rows.length, 2500);
  assert.ok(rowsRes.rows.every((r) => JSON.parse(r.options).length === 4));
});

test('signup, login, wrong password and logout are saved in login history', async () => {
  const s = await call('POST', '/auth/signup', { name: 'Asha Rao', email: 'Asha@Example.com', password: 'secret-pass-1' });
  assert.equal(s.status, 201);
  assert.equal(s.body.user.email, 'asha@example.com');
  assert.equal((await call('POST', '/auth/signup', { name: 'Asha', email: 'asha@example.com', password: 'secret-pass-1' })).status, 409);
  assert.equal((await call('POST', '/auth/signup', { name: 'Bo', email: 'bad', password: 'x' })).status, 400);
  assert.equal((await call('POST', '/auth/login', { email: 'asha@example.com', password: 'nope-nope' })).status, 401);
  const l = await call('POST', '/auth/login', { email: 'asha@example.com', password: 'secret-pass-1' });
  assert.equal(l.status, 200);
  assert.equal((await call('POST', '/auth/logout', null, l.body.token)).status, 204);
  assert.equal((await call('GET', '/auth/me', null, l.body.token)).status, 401); // token revoked
  const again = await call('POST', '/auth/login', { email: 'asha@example.com', password: 'secret-pass-1' });
  const h = await call('GET', '/auth/history', null, again.body.token);
  const events = h.body.history.map((e) => e.event).reverse();
  assert.deepEqual(events, ['signup', 'login', 'login_failed', 'login', 'logout', 'login']);
  const storedRes = await db.execute('SELECT password_hash FROM users');
  const stored = storedRes.rows[0].password_hash;
  assert.match(stored, /^scrypt\$/);
  const sessRes = await db.execute({
    sql: 'SELECT COUNT(*) c FROM sessions WHERE token_hash = ?',
    args: [again.body.token],
  });
  assert.equal(Number(sessRes.rows[0].c), 0); // only hashes stored
});

test('login is rate limited after repeated failures', async () => {
  await call('POST', '/auth/signup', { name: 'Rate Limit', email: 'rl@example.com', password: 'secret-pass-1' });
  let last;
  for (let i = 0; i < 6; i += 1) last = await call('POST', '/auth/login', { email: 'rl@example.com', password: 'wrong-wrong' });
  assert.equal(last.status, 429);
});

test('attempts need a login; mock test scoring is +1 / -0.25 / 0 out of 100 and saved per test', async () => {
  assert.equal((await call('POST', '/attempts', { testId: 1, mode: 'exam' })).status, 401);

  const { body: auth } = await call('POST', '/auth/signup', { name: 'Test Taker', email: 'taker@example.com', password: 'secret-pass-1' });
  const token = auth.token;
  const { body: list } = await call('GET', '/tests');
  const mock3 = list.tests.find((t) => t.title === 'Mock Test 3');
  const mock4 = list.tests.find((t) => t.title === 'Mock Test 4');

  const { body: start } = await call('POST', '/attempts', { testId: mock3.id, mode: 'practice' }, token);
  assert.equal(start.attempt.mode, 'exam'); // mock tests are always exams
  const { body: detail } = await call('GET', `/tests/${mock3.id}`);
  assert.equal(detail.questions.length, 100);
  assert.ok(detail.questions.every((q) => !('correctIndex' in q)));

  const keysRes = await db.execute({
    sql: 'SELECT id, correct_index FROM questions WHERE test_id = ? ORDER BY position',
    args: [mock3.id],
  });
  const keys = keysRes.rows;
  const answers = {};
  keys.slice(0, 60).forEach((k) => (answers[k.id] = Number(k.correct_index))); // 60 right
  keys.slice(60, 90).forEach((k) => (answers[k.id] = (Number(k.correct_index) + 1) % 4)); // 30 wrong
  // 10 unattempted
  const sub = await call('POST', '/results', { attemptId: start.attempt.id, answers, timeSpent: {} }, token);
  assert.equal(sub.status, 201);
  const r = sub.body.result;
  assert.deepEqual([r.correct, r.wrong, r.unanswered], [60, 30, 10]);
  assert.equal(r.score, 52.5);
  assert.equal(r.maxScore, 100);
  assert.equal(r.review.length, 100);
  assert.ok(r.review.every((x) => Number.isInteger(x.correctIndex)));
  assert.equal((await call('POST', '/results', { attemptId: start.attempt.id, answers: {} }, token)).body.duplicate, true);

  // another user cannot read it
  const other = await call('POST', '/auth/signup', { name: 'Other One', email: 'other@example.com', password: 'secret-pass-1' });
  assert.equal((await call('GET', `/results/${start.attempt.id}`, null, other.body.token)).status, 404);

  // a different mock test is independent
  const s4 = await call('POST', '/attempts', { testId: mock4.id, mode: 'exam' }, token);
  const perfect = {};
  const keys4Res = await db.execute({
    sql: 'SELECT id, correct_index FROM questions WHERE test_id = ?',
    args: [mock4.id],
  });
  keys4Res.rows.forEach((k) => (perfect[k.id] = Number(k.correct_index)));
  const r4 = (await call('POST', '/results', { attemptId: s4.body.attempt.id, answers: perfect }, token)).body.result;
  assert.equal(r4.score, 100);

  const mine = await call('GET', '/results', null, token);
  assert.deepEqual(mine.body.results.map((x) => [x.testTitle, x.score]), [['Mock Test 4', 100], ['Mock Test 3', 52.5]]);
});
