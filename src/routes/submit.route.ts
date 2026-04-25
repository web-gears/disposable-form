import type { Request, Response } from 'express';
import { validateFieldValues } from '../utils/validation.js';
import { sessionService } from '../services/session.service.js';

export function submitRoute(req: Request, res: Response): void {
  const { sessionId } = req.params;

  const entry = sessionService.getConfig(sessionId);
  if (!entry) {
    res.status(404).json({ code: 'SESSION_NOT_FOUND' });
    return;
  }

  const now = new Date();
  if (now > entry.expiresAt) {
    res.status(410).json({ code: 'SESSION_EXPIRED' });
    return;
  }

  if (entry.values !== null) {
    res.status(409).json({ code: 'ALREADY_SUBMITTED' });
    return;
  }

  const validation = validateFieldValues(req.body.values, entry.config.fields);
  if (!validation.success) {
    res.status(422).json({ code: 'SUBMIT_VALIDATION_ERROR', error: validation.error });
    return;
  }

  const result = sessionService.submit(sessionId, req.body.values);
  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({ code: 'SESSION_NOT_FOUND' });
    } else if (result.error === 'EXPIRED') {
      res.status(410).json({ code: 'SESSION_EXPIRED' });
    } else if (result.error === 'ALREADY_SUBMITTED') {
      res.status(409).json({ code: 'ALREADY_SUBMITTED' });
    }
    return;
  }

  res.status(200).json({ ok: true });
}