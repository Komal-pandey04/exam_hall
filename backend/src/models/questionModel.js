import { db } from '../db/database.js';

/** Row -> internal question (includes the answer; never send straight to students). */
const toQuestion = (row, test) =>
  row && {
    id: Number(row.id),
    testId: Number(row.test_id),
    position: Number(row.position),
    question: row.question,
    options: JSON.parse(row.options),
    correctIndex: Number(row.correct_index),
    explanation: row.explanation,
    source: row.source,
    imageUrl: row.image_url,
    marks: row.marks != null ? Number(row.marks) : test?.marksPerQuestion ?? 1,
    customMarks: row.marks != null ? Number(row.marks) : null,
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
  async listByTest(testId, test) {
    const res = await db.execute({
      sql: 'SELECT * FROM questions WHERE test_id = ? ORDER BY position, id',
      args: [testId],
    });
    return res.rows.map((row) => toQuestion(row, test));
  },

  async findById(id, test) {
    const res = await db.execute({ sql: 'SELECT * FROM questions WHERE id = ?', args: [id] });
    return toQuestion(res.rows[0], test);
  },

  async create(data) {
    const nextRes = await db.execute({
      sql: 'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM questions WHERE test_id = ?',
      args: [data.testId],
    });
    const next = Number(nextRes.rows[0]?.next ?? 1);
    const info = await db.execute({
      sql: `INSERT INTO questions (test_id, position, question, options, correct_index, explanation, source, image_url, marks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [data.testId, next, data.question, JSON.stringify(data.options), data.correctIndex, data.explanation ?? '', data.source ?? '', data.imageUrl ?? null, data.marks ?? null],
    });
    return this.findById(Number(info.lastInsertRowid));
  },

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) return null;
    const next = { ...current, ...data };
    if (next.correctIndex >= next.options.length) return { error: 'correctIndex must point at one of the options.' };
    await db.execute({
      sql: `UPDATE questions SET question=?, options=?, correct_index=?, explanation=?, source=?, image_url=?, marks=? WHERE id=?`,
      args: [next.question, JSON.stringify(next.options), next.correctIndex, next.explanation, next.source, next.imageUrl ?? null, data.marks !== undefined ? data.marks : current.customMarks, id],
    });
    return this.findById(id);
  },

  async remove(id) {
    const res = await db.execute({ sql: 'DELETE FROM questions WHERE id = ?', args: [id] });
    return res.rowsAffected > 0;
  },
};
