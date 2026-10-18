import { db } from '../db/database.js';

/** Row -> internal question (includes the answer; never send straight to students). */
const toQuestion = (row, test) =>
  row && {
    id: row.id,
    testId: row.test_id,
    position: row.position,
    question: row.question,
    options: JSON.parse(row.options),
    correctIndex: row.correct_index,
    explanation: row.explanation,
    source: row.source,
    imageUrl: row.image_url,
    marks: row.marks ?? test?.marksPerQuestion ?? 1,
    customMarks: row.marks,
  };

/** The shape students receive while a test is running – no answer, no explanation. */
export const toPublicQuestion = (q) => ({
  id: q.id,
  position: q.position,
  question: q.question,
  options: q.options,
  imageUrl: q.imageUrl,
  source: q.source,
  marks: q.marks,
});

export const questionModel = {
  listByTest(testId, test) {
    return db
      .prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY position, id')
      .all(testId)
      .map((row) => toQuestion(row, test));
  },

  findById(id, test) {
    return toQuestion(db.prepare('SELECT * FROM questions WHERE id = ?').get(id), test);
  },

  create(data) {
    const { next } = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM questions WHERE test_id = ?').get(data.testId);
    const info = db
      .prepare(
        `INSERT INTO questions (test_id, position, question, options, correct_index, explanation, source, image_url, marks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(data.testId, next, data.question, JSON.stringify(data.options), data.correctIndex, data.explanation ?? '', data.source ?? '', data.imageUrl ?? null, data.marks ?? null);
    return this.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const next = { ...current, ...data };
    if (next.correctIndex >= next.options.length) return { error: 'correctIndex must point at one of the options.' };
    db.prepare(
      `UPDATE questions SET question=?, options=?, correct_index=?, explanation=?, source=?, image_url=?, marks=? WHERE id=?`
    ).run(next.question, JSON.stringify(next.options), next.correctIndex, next.explanation, next.source, next.imageUrl ?? null, data.marks !== undefined ? data.marks : current.customMarks, id);
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM questions WHERE id = ?').run(id).changes > 0;
  },
};
