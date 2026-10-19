import { db } from '../db/database.js';

const toResult = (row) =>
  row && {
    attemptId: row.attempt_id,
    testId: Number(row.test_id),
    testTitle: row.test_title,
    userId: row.user_id != null ? Number(row.user_id) : null,
    studentName: row.student_name,
    mode: row.mode,
    score: Number(row.score),
    maxScore: Number(row.max_score),
    correct: Number(row.correct),
    wrong: Number(row.wrong),
    unanswered: Number(row.unanswered),
    attempted: Number(row.correct) + Number(row.wrong),
    totalQuestions: Number(row.correct) + Number(row.wrong) + Number(row.unanswered),
    percentage: Number(row.percentage),
    accuracy: Number(row.correct) + Number(row.wrong) > 0 ? Math.round((Number(row.correct) / (Number(row.correct) + Number(row.wrong))) * 10000) / 100 : 0,
    timeTaken: Number(row.time_taken),
    autoSubmitted: Boolean(row.auto_submitted),
    submittedAt: row.submitted_at,
    review: typeof row.review === 'string' ? JSON.parse(row.review) : row.review,
  };

export const resultModel = {
  async findByAttempt(attemptId) {
    const res = await db.execute({ sql: 'SELECT * FROM results WHERE attempt_id = ?', args: [attemptId] });
    return toResult(res.rows[0]);
  },

  async listByUser(userId) {
    const res = await db.execute({
      sql: `SELECT r.attempt_id, r.test_id, r.test_title, r.score, r.max_score, r.correct, r.wrong, r.unanswered,
                   r.time_taken, r.auto_submitted, r.submitted_at, r.mode, t.mock_number
            FROM results r LEFT JOIN tests t ON t.id = r.test_id WHERE r.user_id = ? ORDER BY r.id DESC`,
      args: [userId],
    });
    return res.rows.map((r) => ({
      attemptId: r.attempt_id,
      testId: Number(r.test_id),
      testTitle: r.test_title,
      mockNumber: r.mock_number != null ? Number(r.mock_number) : null,
      mode: r.mode,
      score: Number(r.score),
      maxScore: Number(r.max_score),
      correct: Number(r.correct),
      wrong: Number(r.wrong),
      unanswered: Number(r.unanswered),
      timeTaken: Number(r.time_taken),
      autoSubmitted: Boolean(r.auto_submitted),
      submittedAt: r.submitted_at,
    }));
  },

  /** Stores the result and closes the attempt atomically. */
  async save(attempt, test, calc, { answers, review, timeTaken, autoSubmitted }) {
    await db.batch([
      {
        sql: `INSERT INTO results (attempt_id, test_id, student_name, mode, answers, score, max_score, correct, wrong,
                                  unanswered, percentage, time_taken, auto_submitted, test_title, review, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          attempt.id,
          attempt.testId,
          attempt.studentName,
          attempt.mode,
          JSON.stringify(answers),
          calc.score,
          calc.maxScore,
          calc.correct,
          calc.wrong,
          calc.unanswered,
          calc.percentage,
          timeTaken,
          autoSubmitted ? 1 : 0,
          test.title,
          JSON.stringify(review),
          attempt.userId,
        ],
      },
      {
        sql: "UPDATE attempts SET status = 'submitted' WHERE id = ?",
        args: [attempt.id],
      },
    ], 'write');
    return this.findByAttempt(attempt.id);
  },
};
