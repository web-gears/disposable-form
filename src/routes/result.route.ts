import type { Request, Response } from 'express';
import type { EncryptedSessionResponse, SessionResponse } from '../types/index.js';
import { sessionService } from '../services/session.service.js';

export function resultRoute(req: Request, res: Response): void {
  const { sessionId } = req.params;

  const result = sessionService.getResult(sessionId);

  if (result.status === 'NOT_FOUND') {
    res.status(404).json({ code: 'SESSION_NOT_FOUND' });
    return;
  }

  if (result.status === 'EXPIRED') {
    res.status(410).json({ code: 'SESSION_EXPIRED' });
    return;
  }

  if (result.status === 'NOT_SUBMITTED') {
    res.status(202).json({ code: 'NOT_YET_SUBMITTED' });
    return;
  }

  if (result.status !== 'OK') return;
  res.status(200).json(result.data);
}