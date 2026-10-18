import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body is not valid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  if (err?.code?.startsWith?.('SQLITE_')) {
    console.error('[db]', err);
    return res.status(500).json({ message: 'A database error occurred. Please try again shortly.' });
  }
  console.error('[server]', err);
  return res.status(500).json({ message: env.isProduction ? 'Something went wrong on the server.' : err.message });
}
