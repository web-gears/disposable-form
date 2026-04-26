import express from 'express';
import { createRoute } from './routes/create.route.js';
import { formRoute } from './routes/form.route.js';
import { submitRoute } from './routes/submit.route.js';
import { resultRoute } from './routes/result.route.js';
import * as fs from 'fs';
import * as path from 'path';

const app = express();

app.use(express.json());
app.use('/ui', express.static('./dist/ui'));
app.use('/ui', express.static('./src/ui'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'src', 'ui', 'landing.html'), 'utf-8');
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