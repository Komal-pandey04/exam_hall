import { env } from './config/env.js';
import { createApp } from './app.js';
import { db, initSchema } from './db/database.js';
import { seedIfEmpty, seedMockTests } from './db/seed.js';

try {
  await initSchema();
  const practiceSeeded = await seedIfEmpty();
  const mocks = await seedMockTests();
  if (practiceSeeded) console.log('Database was empty – practice sets loaded.');
  if (mocks) console.log(`Created ${mocks} mock test(s).`);
} catch (err) {
  if (err?.status === 401 || err?.message?.includes('401')) {
    console.error('\n❌ TURSO AUTHENTICATION FAILED (HTTP 401 Unauthorized)');
    console.error('The TURSO_AUTH_TOKEN provided in Render is missing or invalid for this database.');
    console.error('Please generate a token in your Turso dashboard and set TURSO_AUTH_TOKEN in Render environment variables.\n');
  }
  throw err;
}
if (!env.adminKey) console.warn('WARNING: ADMIN_KEY is not set – the admin panel is disabled.');

const server = createApp().listen(env.port, () => {
  console.log(`ExamHall API listening on port ${env.port}`);
  console.log(`Allowed origins: ${env.clientUrls.join(', ')}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
