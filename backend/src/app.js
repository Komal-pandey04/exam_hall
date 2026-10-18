import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-machine tools (curl, Postman) that send no Origin header.
        if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => res.json({ name: 'ExamHall API', docs: '/api/health' }));
  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
