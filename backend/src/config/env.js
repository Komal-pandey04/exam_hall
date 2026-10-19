import 'dotenv/config';
import path from 'node:path';

const cleanStr = (v) => (typeof v === 'string' ? v.trim().replace(/^["']|["']$/g, '').trim() : '');

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrls,
  dbPath: path.resolve(cleanStr(process.env.DB_PATH) || './data/examhall.db'),
  tursoDatabaseUrl: cleanStr(process.env.TURSO_DATABASE_URL),
  tursoAuthToken: cleanStr(process.env.TURSO_AUTH_TOKEN),
  adminKey: cleanStr(process.env.ADMIN_KEY),
  sessionDays: Number(process.env.SESSION_DAYS) || 30,
  mockDurationMinutes: Number(process.env.MOCK_DURATION_MINUTES) || 120,
  isProduction: process.env.NODE_ENV === 'production',
};
