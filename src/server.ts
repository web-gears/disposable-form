import express from 'express';
import rateLimit from 'express-rate-limit';
import { createRoute } from './routes/create.route.js';
import { formRoute } from './routes/form.route.js';
import { submitRoute } from './routes/submit.route.js';
import { resultRoute } from './routes/result.route.js';
import { sessionService } from './services/session.service.js';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const startTime = new Date();

app.use(express.json({ limit: '10kb' }));

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests' },
});

function isLocalRequest(req: { ip?: string; get: (header: string) => string | undefined }): boolean {
  const forwarded = req.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.ip;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '::';
}

app.use('/ui', express.static('./dist/ui'));
app.use('/ui', express.static('./src/ui'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/stats', (req, res) => {
  const stats = sessionService.getStats();
  const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
  let html = fs.readFileSync(path.join(process.cwd(), 'dist', 'ui', 'stats.html'), 'utf-8');
  const scriptTag = `<script>window.__STATS__ = ${JSON.stringify({
    activeSessions: stats.activeSessions,
    sessionsToday: stats.sessionsToday,
    sessionsWeek: stats.sessionsWeek,
    sessionsMonth: stats.sessionsMonth,
    totalSessions: stats.totalSessions,
    uptimeSeconds: uptime,
  })};</script>`;
  html = html.replace('<!-- injected-stats -->', scriptTag);
  res.type('html').send(html);
});

app.get('/get-stats', (req, res) => {
  if (!isLocalRequest(req)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Local access only' });
    return;
  }
  const stats = sessionService.getStats();
  const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
  res.json({
    activeSessions: stats.activeSessions,
    sessionsToday: stats.sessionsToday,
    sessionsWeek: stats.sessionsWeek,
    sessionsMonth: stats.sessionsMonth,
    totalSessions: stats.totalSessions,
    uptimeSeconds: uptime,
  });
});

app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'ui', 'landing.html'), 'utf-8');
  res.type('html').send(html);
});

app.post('/create', createLimiter, createRoute);
app.get('/:sessionId', formRoute);
app.post('/:sessionId/submit', submitLimiter, submitRoute);
app.get('/result/:sessionId', resultRoute);

app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    res.status(408).json({ code: 'REQUEST_TIMEOUT' });
  });
  next();
});

const port = parseInt(process.env.PORT ?? '3000', 10);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;