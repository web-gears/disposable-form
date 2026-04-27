import type { Request, Response } from 'express';
import { validateCreateForm } from '../utils/validation.js';
import { sessionService } from '../services/session.service.js';

export function createRoute(req: Request, res: Response): void {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const validation = validateCreateForm(req.body);
  if (!validation.success) {
    res.status(422).json({
      code: 'VALIDATION_ERROR',
      errors: validation.error.flatten(),
    });
    return;
  }

  const result = sessionService.create(validation.data, baseUrl);
  if ('error' in result) {
    res.status(409).json({ code: 'SESSION_EXISTS' });
    return;
  }

  res.status(200).type('application/json').json(result);
}