import { db } from '../db/database.js';

const toTest = (row) =>
  row && {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    marksPerQuestion: row.marks_per_question,
    negativeMarking: Boolean(row.negative_marking),
    negativeMarks: row.negative_marks,
    isActive: Boolean(row.is_active),
    category: row.category,
    mockNumber: row.mock_number ?? null,
    questionCount: row.question_count ?? undefined,
    totalMarks: row.total_marks ?? undefined,
  };

const SELECT_WITH_COUNTS = `
  SELECT t.*,
         COUNT(q.id) AS question_count,
         COALESCE(SUM(COALESCE(q.marks, t.marks_per_question)), 0) AS total_marks
  FROM tests t LEFT JOIN questions q ON q.test_id = t.id`;

export const testModel = {
  list({ includeInactive = false } = {}) {
    const where = includeInactive ? '' : 'WHERE t.is_active = 1';
    // Mock tests first in numeric order, then practice sets.
    return db.prepare(`${SELECT_WITH_COUNTS} ${where} GROUP BY t.id ORDER BY (t.category = 'mock') DESC, t.mock_number, t.id`).all().map(toTest);
  },

  findById(id) {
    return toTest(db.prepare(`${SELECT_WITH_COUNTS} WHERE t.id = ? GROUP BY t.id`).get(id));
  },

  create(data) {
    const info = db
      .prepare(
        `INSERT INTO tests (title, description, duration_minutes, marks_per_question, negative_marking, negative_marks)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(data.title, data.description ?? '', data.durationMinutes, data.marksPerQuestion, data.negativeMarking ? 1 : 0, data.negativeMarks ?? 0.25);
    return this.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const current = this.findById(id);
    if (!current) return null;
    const next = { ...current, ...data };
    db.prepare(
      `UPDATE tests SET title=?, description=?, duration_minutes=?, marks_per_question=?,
                        negative_marking=?, negative_marks=?, is_active=? WHERE id=?`
    ).run(next.title, next.description, next.durationMinutes, next.marksPerQuestion, next.negativeMarking ? 1 : 0, next.negativeMarks, next.isActive ? 1 : 0, id);
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM tests WHERE id = ?').run(id).changes > 0;
  },

  stats() {
    return db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM tests WHERE is_active = 1) AS tests,
                (SELECT COUNT(*) FROM questions q JOIN tests t ON t.id = q.test_id WHERE t.is_active = 1) AS questions,
                (SELECT COUNT(*) FROM results) AS attempts`
      )
      .get();
  },
};
