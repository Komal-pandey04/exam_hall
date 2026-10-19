import { db } from '../db/database.js';
import { hashToken, newToken } from '../utils/password.js';
import { env } from '../config/env.js';

const toUser = (row) => row && { id: Number(row.id), name: row.name, email: row.email, createdAt: row.created_at, lastLoginAt: row.last_login_at };

export const userModel = {
  async findByEmail(email) {
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return toUser(res.rows[0]);
  },

  toUser,

  async create({ name, email, passwordHash }) {
    const res = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      args: [name, email, passwordHash],
    });
    return this.findById(Number(res.lastInsertRowid));
  },

  async touchLogin(id) {
    await db.execute({ sql: "UPDATE users SET last_login_at = datetime('now') WHERE id = ?", args: [id] });
  },

  /** Creates a session; only the SHA-256 of the token is stored. */
  async createSession(userId) {
    const token = newToken();
    const now = Date.now();
    await db.batch([
      { sql: 'DELETE FROM sessions WHERE expires_at < ?', args: [now] },
      { sql: 'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', args: [hashToken(token), userId, now, now + env.sessionDays * 86400000] },
    ], 'write');
    return token;
  },

  async findBySession(token) {
    if (!token) return null;
    const res = await db.execute({
      sql: 'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?',
      args: [hashToken(token), Date.now()],
    });
    return toUser(res.rows[0]);
  },

  async deleteSession(token) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [hashToken(token)] });
  },

  async logEvent({ userId = null, email, event, ip = '', userAgent = '' }) {
    await db.execute({
      sql: 'INSERT INTO login_history (user_id, email, event, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
      args: [userId, email, event, String(ip).slice(0, 64), String(userAgent).slice(0, 300)],
    });
  },

  async history(userId, limit = 100) {
    const res = await db.execute({
      sql: 'SELECT id, event, ip, user_agent, created_at FROM login_history WHERE user_id = ? ORDER BY id DESC LIMIT ?',
      args: [userId, limit],
    });
    return res.rows.map((r) => ({ id: Number(r.id), event: r.event, ip: r.ip, userAgent: r.user_agent, at: r.created_at }));
  },
};
