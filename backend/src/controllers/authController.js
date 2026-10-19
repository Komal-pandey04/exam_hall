import { userModel } from '../models/userModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { badRequest, HttpError } from '../utils/httpError.js';
import { bearerToken } from '../middleware/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const DUMMY_HASH = hashPassword('timing-equaliser');
const fails = new Map(); // "ip|email" -> { count, first }

const ctx = (req) => ({ ip: req.ip || '', userAgent: req.get('user-agent') || '' });
const cleanEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

function throttled(key) {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    fails.delete(key);
    return false;
  }
  return f.count >= MAX_FAILS;
}
function recordFail(key) {
  const f = fails.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) fails.set(key, { count: 1, first: Date.now() });
  else f.count += 1;
}

export const signup = async (req, res) => {
  const { name, password } = req.body ?? {};
  const email = cleanEmail(req.body?.email);
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) throw badRequest('Please enter your name (2-80 characters).');
  if (!EMAIL_RE.test(email) || email.length > 200) throw badRequest('Please enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw badRequest('Password must be 8-128 characters.');
  if (await userModel.findByEmail(email)) throw new HttpError(409, 'An account with this email already exists. Try logging in.');

  const user = await userModel.create({ name: name.trim().replace(/\s+/g, ' '), email, passwordHash: hashPassword(password) });
  await userModel.logEvent({ userId: user.id, email, event: 'signup', ...ctx(req) });
  await userModel.touchLogin(user.id);
  await userModel.logEvent({ userId: user.id, email, event: 'login', ...ctx(req) });
  res.status(201).json({ user, token: await userModel.createSession(user.id) });
};

export const login = async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const password = req.body?.password;
  const key = `${req.ip}|${email}`;
  if (throttled(key)) throw new HttpError(429, 'Too many failed attempts. Please try again in 15 minutes.');

  const row = typeof password === 'string' && password.length <= 128 ? await userModel.findByEmail(email) : null;
  // Always run a hash so response time does not reveal whether the email exists.
  const ok = row ? verifyPassword(password, row.password_hash) : (verifyPassword(password ?? '', DUMMY_HASH), false);
  if (!ok) {
    recordFail(key);
    await userModel.logEvent({ userId: row?.id ?? null, email: email.slice(0, 200), event: 'login_failed', ...ctx(req) });
    throw new HttpError(401, 'Incorrect email or password.');
  }
  fails.delete(key);
  await userModel.touchLogin(row.id);
  await userModel.logEvent({ userId: row.id, email, event: 'login', ...ctx(req) });
  res.json({ user: await userModel.findById(row.id), token: await userModel.createSession(row.id) });
};

export const logout = async (req, res) => {
  const token = bearerToken(req);
  await userModel.deleteSession(token);
  await userModel.logEvent({ userId: req.user.id, email: req.user.email, event: 'logout', ...ctx(req) });
  res.status(204).end();
};

export const me = (req, res) => res.json({ user: req.user });
export const history = async (req, res) => res.json({ history: await userModel.history(req.user.id) });
