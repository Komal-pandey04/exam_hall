import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';

function createDbClient() {
  if (env.tursoDatabaseUrl) {
    return createClient({
      url: env.tursoDatabaseUrl,
      authToken: env.tursoAuthToken || undefined,
    });
  }
  fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
  return createClient({
    url: pathToFileURL(env.dbPath).toString(),
  });
}

export const db = createDbClient();

export async function initSchema() {
  await db.execute('PRAGMA foreign_keys = ON');

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS tests (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      title              TEXT    NOT NULL,
      description        TEXT    NOT NULL DEFAULT '',
      duration_minutes   INTEGER NOT NULL DEFAULT 30,
      marks_per_question REAL    NOT NULL DEFAULT 1,
      negative_marking   INTEGER NOT NULL DEFAULT 0,
      negative_marks     REAL    NOT NULL DEFAULT 0.25,
      is_active          INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id       INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      position      INTEGER NOT NULL DEFAULT 0,
      question      TEXT    NOT NULL,
      options       TEXT    NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation   TEXT    NOT NULL DEFAULT '',
      source        TEXT    NOT NULL DEFAULT '',
      image_url     TEXT,
      marks         REAL
    );
    CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id, position);

    CREATE TABLE IF NOT EXISTS attempts (
      id           TEXT PRIMARY KEY,
      test_id      INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      student_name TEXT    NOT NULL,
      mode         TEXT    NOT NULL CHECK (mode IN ('exam','practice')),
      started_at   INTEGER NOT NULL,
      ends_at      INTEGER NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'in_progress'
    );

    CREATE TABLE IF NOT EXISTS results (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id     TEXT    NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
      test_id        INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      student_name   TEXT    NOT NULL,
      mode           TEXT    NOT NULL,
      answers        TEXT    NOT NULL,
      score          REAL    NOT NULL,
      max_score      REAL    NOT NULL,
      correct        INTEGER NOT NULL,
      wrong          INTEGER NOT NULL,
      unanswered     INTEGER NOT NULL,
      percentage     REAL    NOT NULL,
      time_taken     INTEGER NOT NULL,
      auto_submitted INTEGER NOT NULL DEFAULT 0,
      test_title     TEXT    NOT NULL DEFAULT '',
      review         TEXT    NOT NULL DEFAULT '[]',
      submitted_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS login_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      email      TEXT    NOT NULL,
      event      TEXT    NOT NULL CHECK (event IN ('signup','login','logout','login_failed')),
      ip         TEXT    NOT NULL DEFAULT '',
      user_agent TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, id);
  `);

  // Lightweight migrations for databases created by earlier versions.
  await addColumn('tests', 'category', "TEXT NOT NULL DEFAULT 'practice'");
  await addColumn('tests', 'mock_number', 'INTEGER');
  await addColumn('attempts', 'user_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
  await addColumn('results', 'user_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');

  await db.executeMultiple(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tests_mock_number ON tests(mock_number) WHERE mock_number IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_results_user ON results(user_id, id);
  `);
}

async function addColumn(table, column, definition) {
  const res = await db.execute(`PRAGMA table_info(${table})`);
  const exists = res.rows.some((c) => c.name === column);
  if (!exists) await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
