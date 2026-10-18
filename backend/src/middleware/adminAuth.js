import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function requireAdmin(req, res, next) {
  if (!env.adminKey) return next(new HttpError(503, 'Admin access is disabled: ADMIN_KEY is not configured on the server.'));
  const provided = String(req.get('x-admin-key') || '');
  if (!provided || !safeEqual(provided, env.adminKey)) return next(new HttpError(401, 'Invalid admin key.'));
  return next();
}
