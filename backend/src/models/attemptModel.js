import crypto from 'node:crypto';
import { db } from '../db/database.js';

const toAttempt = (row) =>
  row && {
    id: row.id,
    testId: Number(row.test_id),
    studentName: row.student_name,
    mode: row.mode,
    startedAt: Number(row.started_at),
    endsAt: Number(row.ends_at),
    status: row.status,
    userId: row.user_id != null ? Number(row.user_id) : null,
  };

export const attemptModel = {
  async create({ testId, studentName, userId, mode, durationMinutes }) {
    const id = crypto.randomUUID();
    const startedAt = Date.now();
    const endsAt = startedAt + durationMinutes * 60 * 1000;
    await db.execute({
      sql: 'INSERT INTO attempts (id, test_id, student_name, mode, started_at, ends_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, testId, studentName, mode, startedAt, endsAt, userId],
    });
    return this.findById(id);
  },

  async findById(id) {
    const res = await db.execute({ sql: 'SELECT * FROM attempts WHERE id = ?', args: [id] });
    return toAttempt(res.rows[0]);
  },

  async markSubmitted(id) {
    await db.execute({ sql: "UPDATE attempts SET status = 'submitted' WHERE id = ?", args: [id] });
  },
};
