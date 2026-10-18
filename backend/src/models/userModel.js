import { db } from '../db/database.js';
import { hashToken, newToken } from '../utils/password.js';
import { env } from '../config/env.js';

const toUser = (row) => row && { id: row.id, name: row.name, email: row.email, createdAt: row.created_at, lastLoginAt: row.last_login_at };

export const userModel = {
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)),
  toUser,

  create({ name, email, passwordHash }) {
    const id = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash).lastInsertRowid;
    return this.findById(id);
  },

  touchLogin: (id) => db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id),

  /** Creates a session; only the SHA-256 of the token is stored. */
  createSession(userId) {
    const token = newToken();
    const now = Date.now();
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
    db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(hashToken(token), userId, now, now + env.sessionDays * 86400000);
    return token;
  },

  findBySession(token) {
    if (!token) return null;
    const row = db
      .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
      .get(hashToken(token), Date.now());
    return toUser(row);
  },

  deleteSession: (token) => db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token)),

  logEvent({ userId = null, email, event, ip = '', userAgent = '' }) {
    db.prepare('INSERT INTO login_history (user_id, email, event, ip, user_agent) VALUES (?, ?, ?, ?, ?)').run(userId, email, event, String(ip).slice(0, 64), String(userAgent).slice(0, 300));
  },

  history(userId, limit = 100) {
    return db
      .prepare('SELECT id, event, ip, user_agent, created_at FROM login_history WHERE user_id = ? ORDER BY id DESC LIMIT ?')
      .all(userId, limit)
      .map((r) => ({ id: r.id, event: r.event, ip: r.ip, userAgent: r.user_agent, at: r.created_at }));
  },
};
