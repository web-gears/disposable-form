import type { Request, Response } from 'express';
import { sessionService } from '../services/session.service.js';
import { errorHtml } from '../utils/errorHtml.js';
import * as fs from 'fs';
import * as path from 'path';

function getHtml(sessionId: string, config: object): string {
  let html = fs.readFileSync(path.join(process.cwd(), 'dist', 'ui', 'index.html'), 'utf-8');
  const scriptTag = `<script>window.__FORM_CONFIG__ = ${JSON.stringify(config)}; window.__SESSION_ID__ = "${sessionId}";</script>`;
  html = html.replace('<!-- injected-config -->', scriptTag);
  return html;
}

export function formRoute(req: Request, res: Response): void {
  const { sessionId } = req.params;

  const entry = sessionService.getConfig(sessionId);
  if (!entry) {
    res.status(404).type('html').send(errorHtml('404', 'Session Not Found', 'This form session does not exist or may have been removed.'));
    return;
  }

  const now = new Date();
  if (now > entry.expiresAt) {
    res.status(410).type('html').send(errorHtml('410', 'Session Expired', 'This form session has expired and is no longer accessible.'));
    return;
  }

  const html = getHtml(sessionId, {
    fields: entry.config.fields,
    timeoutSeconds: Math.max(0, Math.ceil((entry.expiresAt.getTime() - Date.now()) / 1000)),
  });

  res.type('html').send(html);
}