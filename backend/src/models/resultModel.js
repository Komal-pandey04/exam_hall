import { db } from '../db/database.js';

const toResult = (row) =>
  row && {
    attemptId: row.attempt_id,
    testId: row.test_id,
    testTitle: row.test_title,
    userId: row.user_id,
    studentName: row.student_name,
    mode: row.mode,
    score: row.score,
    maxScore: row.max_score,
    correct: row.correct,
    wrong: row.wrong,
    unanswered: row.unanswered,
    attempted: row.correct + row.wrong,
    totalQuestions: row.correct + row.wrong + row.unanswered,
    percentage: row.percentage,
    accuracy: row.correct + row.wrong > 0 ? Math.round((row.correct / (row.correct + row.wrong)) * 10000) / 100 : 0,
    timeTaken: row.time_taken,
    autoSubmitted: Boolean(row.auto_submitted),
    submittedAt: row.submitted_at,
    review: JSON.parse(row.review),
  };

export const resultModel = {
  findByAttempt: (attemptId) => toResult(db.prepare('SELECT * FROM results WHERE attempt_id = ?').get(attemptId)),

  listByUser(userId) {
    return db
      .prepare(
        `SELECT r.attempt_id, r.test_id, r.test_title, r.score, r.max_score, r.correct, r.wrong, r.unanswered,
                r.time_taken, r.auto_submitted, r.submitted_at, r.mode, t.mock_number
         FROM results r LEFT JOIN tests t ON t.id = r.test_id WHERE r.user_id = ? ORDER BY r.id DESC`
      )
      .all(userId)
      .map((r) => ({
        attemptId: r.attempt_id, testId: r.test_id, testTitle: r.test_title, mockNumber: r.mock_number ?? null, mode: r.mode,
        score: r.score, maxScore: r.max_score, correct: r.correct, wrong: r.wrong, unanswered: r.unanswered,
        timeTaken: r.time_taken, autoSubmitted: Boolean(r.auto_submitted), submittedAt: r.submitted_at,
      }));
  },

  /** Stores the result and closes the attempt atomically. */
  save(attempt, test, calc, { answers, review, timeTaken, autoSubmitted }) {
    db.transaction(() => {
      db.prepare(
        `INSERT INTO results (attempt_id, test_id, student_name, mode, answers, score, max_score, correct, wrong,
                              unanswered, percentage, time_taken, auto_submitted, test_title, review, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(attempt.id, attempt.testId, attempt.studentName, attempt.mode, JSON.stringify(answers), calc.score, calc.maxScore, calc.correct, calc.wrong, calc.unanswered, calc.percentage, timeTaken, autoSubmitted ? 1 : 0, test.title, JSON.stringify(review), attempt.userId);
      db.prepare("UPDATE attempts SET status = 'submitted' WHERE id = ?").run(attempt.id);
    })();
    return this.findByAttempt(attempt.id);
  },
};
