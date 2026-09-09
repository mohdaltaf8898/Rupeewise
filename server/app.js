import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { expensesRouter } from './routes/expenses.js';
import { insightsRouter } from './routes/insights.js';

export function createApp(repo) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '50kb' }));
  app.use(morgan(config.isProd ? 'combined' : 'dev'));

  // ---- API ----
  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'ok',
      version: config.version,
      database: repo.mode === 'memory' ? 'memory-demo' : 'mongodb',
      expenses: await repo.count().catch(() => null),
      time: new Date().toISOString(),
    });
  });

  app.use('/api/expenses', expensesRouter(repo));
  app.use('/api', insightsRouter(repo));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // ---- Static client (production) ----
  if (config.isProd) {
    const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // ---- Central error handler (incl. Zod validation errors) ----
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
