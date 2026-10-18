import fs from 'node:fs';
import { db, initSchema } from './database.js';
import { env } from '../config/env.js';

const dataUrl = new URL('../data/questions.json', import.meta.url);
const mockUrl = new URL('../data/mock_tests.json', import.meta.url);
const SET_SIZE = 30;

/** Split a list into the fewest roughly-equal chunks of at most `max` items. */
function balancedChunks(list, max) {
  const parts = Math.ceil(list.length / max);
  const base = Math.floor(list.length / parts);
  const extra = list.length % parts;
  const chunks = [];
  let start = 0;
  for (let i = 0; i < parts; i += 1) {
    const size = base + (i < extra ? 1 : 0);
    chunks.push(list.slice(start, start + size));
    start += size;
  }
  return chunks;
}

function buildTests(chapters) {
  const tests = [];
  for (const chapter of chapters) {
    const sets = balancedChunks(chapter.questions, SET_SIZE);
    sets.forEach((questions, i) => {
      const suffix = sets.length > 1 ? ` – Set ${i + 1}` : '';
      tests.push({
        title: `${chapter.title}${suffix}`,
        description: `Management Accounting · ${chapter.title}. Previous-year exam questions (UGC NET, UPPSC, PGT/TGT and more).`,
        durationMinutes: Math.max(10, questions.length),
        questions,
      });
    });
  }
  return tests;
}

/**
 * Idempotent: creates "Mock Test 1..25" (100 questions each) when missing.
 * A test that already exists is never touched, so admin edits survive restarts.
 */
export function seedMockTests() {
  initSchema();
  const bank = JSON.parse(fs.readFileSync(mockUrl, 'utf-8'));
  const exists = db.prepare('SELECT 1 FROM tests WHERE mock_number = ?');
  const insertTest = db.prepare(
    `INSERT INTO tests (title, description, duration_minutes, marks_per_question, negative_marking, negative_marks, category, mock_number)
     VALUES (?, ?, ?, 1, 1, 0.25, 'mock', ?)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (test_id, position, question, options, correct_index, explanation, source) VALUES (?, ?, ?, ?, ?, '', ?)`
  );
  let created = 0;
  db.transaction(() => {
    for (const t of bank.tests) {
      if (exists.get(t.number)) continue;
      const id = insertTest.run(
        `Mock Test ${t.number}`,
        'UKSSSC Assistant Accountant · 100 questions · +1 for correct, −0.25 for wrong, 0 if unattempted.',
        env.mockDurationMinutes,
        t.number
      ).lastInsertRowid;
      t.questions.forEach((q, i) => insertQuestion.run(id, i + 1, q.q, JSON.stringify(q.o), q.a, `Mock Test ${t.number} · Q${i + 1}`));
      created += 1;
    }
  })();
  return created;
}

export function seedIfEmpty({ reset = false } = {}) {
  initSchema();
  if (reset) {
    db.exec('DELETE FROM results; DELETE FROM attempts; DELETE FROM questions; DELETE FROM tests;');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tests','questions','results')");
  }
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM tests WHERE category = 'practice'").get();
  if (count > 0) return false;

  const chapters = JSON.parse(fs.readFileSync(dataUrl, 'utf-8'));
  const insertTest = db.prepare(
    `INSERT INTO tests (title, description, duration_minutes, marks_per_question, negative_marking, negative_marks)
     VALUES (@title, @description, @durationMinutes, 1, 0, 0.25)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (test_id, position, question, options, correct_index, explanation, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    for (const test of buildTests(chapters)) {
      const testId = insertTest.run(test).lastInsertRowid;
      test.questions.forEach((q, index) => {
        insertQuestion.run(testId, index + 1, q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, q.source);
      });
    }
  })();
  return true;
}

// Run directly: `npm run seed` or `npm run seed:reset`
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const seeded = seedIfEmpty({ reset: process.argv.includes('--reset') });
  seedMockTests();
  const tests = db.prepare('SELECT COUNT(*) AS c FROM tests').get().c;
  const questions = db.prepare('SELECT COUNT(*) AS c FROM questions').get().c;
  console.log(seeded ? `Seeded ${tests} tests / ${questions} questions.` : `Database already has data (${tests} tests / ${questions} questions). Use "npm run seed:reset" to reload.`);
}
