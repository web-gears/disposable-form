import express from 'express';
import cors from 'cors';
import { createRoute } from './routes/create.route.js';
import { formRoute } from './routes/form.route.js';
import { submitRoute } from './routes/submit.route.js';
import { resultRoute } from './routes/result.route.js';
import { sessionService } from './services/session.service.js';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const startTime = new Date();

app.use(cors());
app.use(express.json());
app.use('/ui', express.static('./dist/ui'));
app.use('/ui', express.static('./src/ui'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/stats', (req, res) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'ui', 'stats.html'), 'utf-8');
  res.type('html').send(html);
});

app.get('/get-stats', (req, res) => {
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

app.post('/create', createRoute);
app.get('/:sessionId', formRoute);
app.post('/:sessionId/submit', submitRoute);
app.get('/result/:sessionId', resultRoute);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;