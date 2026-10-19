import { db } from '../db/database.js';

const toTest = (row) =>
  row && {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    durationMinutes: Number(row.duration_minutes),
    marksPerQuestion: Number(row.marks_per_question),
    negativeMarking: Boolean(row.negative_marking),
    negativeMarks: Number(row.negative_marks),
    isActive: Boolean(row.is_active),
    category: row.category,
    mockNumber: row.mock_number != null ? Number(row.mock_number) : null,
    questionCount: row.question_count != null ? Number(row.question_count) : undefined,
    totalMarks: row.total_marks != null ? Number(row.total_marks) : undefined,
  };

const SELECT_WITH_COUNTS = `
  SELECT t.*,
         COUNT(q.id) AS question_count,
         COALESCE(SUM(COALESCE(q.marks, t.marks_per_question)), 0) AS total_marks
  FROM tests t LEFT JOIN questions q ON q.test_id = t.id`;

export const testModel = {
  async list({ includeInactive = false } = {}) {
    const where = includeInactive ? '' : 'WHERE t.is_active = 1';
    // Mock tests first in numeric order, then practice sets.
    const res = await db.execute(`${SELECT_WITH_COUNTS} ${where} GROUP BY t.id ORDER BY (t.category = 'mock') DESC, t.mock_number, t.id`);
    return res.rows.map(toTest);
  },

  async findById(id) {
    const res = await db.execute({ sql: `${SELECT_WITH_COUNTS} WHERE t.id = ? GROUP BY t.id`, args: [id] });
    return toTest(res.rows[0]);
  },

  async create(data) {
    const res = await db.execute({
      sql: `INSERT INTO tests (title, description, duration_minutes, marks_per_question, negative_marking, negative_marks)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [data.title, data.description ?? '', data.durationMinutes, data.marksPerQuestion, data.negativeMarking ? 1 : 0, data.negativeMarks ?? 0.25],
    });
    return this.findById(Number(res.lastInsertRowid));
  },

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) return null;
    const next = { ...current, ...data };
    await db.execute({
      sql: `UPDATE tests SET title=?, description=?, duration_minutes=?, marks_per_question=?,
                            negative_marking=?, negative_marks=?, is_active=? WHERE id=?`,
      args: [next.title, next.description, next.durationMinutes, next.marksPerQuestion, next.negativeMarking ? 1 : 0, next.negativeMarks, next.isActive ? 1 : 0, id],
    });
    return this.findById(id);
  },

  async remove(id) {
    const res = await db.execute({ sql: 'DELETE FROM tests WHERE id = ?', args: [id] });
    return res.rowsAffected > 0;
  },

  async stats() {
    const res = await db.execute(
      `SELECT (SELECT COUNT(*) FROM tests WHERE is_active = 1) AS tests,
              (SELECT COUNT(*) FROM questions q JOIN tests t ON t.id = q.test_id WHERE t.is_active = 1) AS questions,
              (SELECT COUNT(*) FROM results) AS attempts`
    );
    const row = res.rows[0];
    return {
      tests: Number(row?.tests ?? 0),
      questions: Number(row?.questions ?? 0),
      attempts: Number(row?.attempts ?? 0),
    };
  },
};
