import type {
  CreateFormRequest,
  CreateFormResponse,
  SessionEntry,
  SessionResponse
} from '../types/index.js';

export class SessionService {
  private store = new Map<string, SessionEntry>();

  create(req: CreateFormRequest, baseUrl: string): CreateFormResponse | { error: 'DUPLICATE' } {
    if (this.store.has(req.sessionId)) {
      return { error: 'DUPLICATE' };
    }

    const timeoutSeconds = req.timeoutSeconds ?? 60;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeoutSeconds * 1000);

    const timer = setTimeout(() => {
      this.expire(req.sessionId);
    }, timeoutSeconds * 1000);

    const entry: SessionEntry = {
      config: req,
      values: null,
      createdAt: now,
      expiresAt,
      submittedAt: null,
      timer,
    };

    this.store.set(req.sessionId, entry);

    return {
      sessionId: req.sessionId,
      formUrl: `${baseUrl}/${req.sessionId}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  getConfig(sessionId: string): SessionEntry | undefined {
    return this.store.get(sessionId);
  }

  has(sessionId: string): boolean {
    return this.store.has(sessionId);
  }

  submit(sessionId: string, values: Record<string, unknown>): { error: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_SUBMITTED' } | { ok: true } {
    const entry = this.store.get(sessionId);
    if (!entry) {
      return { error: 'NOT_FOUND' };
    }

    if (entry.values !== null) {
      return { error: 'ALREADY_SUBMITTED' };
    }

    entry.values = values;
    entry.submittedAt = new Date();

    return { ok: true };
  }

  getResult(sessionId: string): { status: 'NOT_FOUND' | 'EXPIRED' | 'NOT_SUBMITTED' } | { status: 'OK'; data: SessionResponse } {
    const entry = this.store.get(sessionId);
    if (!entry) {
      return { status: 'NOT_FOUND' };
    }

    const now = new Date();
    if (now > entry.expiresAt) {
      return { status: 'EXPIRED' };
    }

    if (entry.submittedAt === null) {
      return { status: 'NOT_SUBMITTED' };
    }

    return {
      status: 'OK',
      data: {
        sessionId,
        submittedAt: entry.submittedAt.toISOString(),
        expiresAt: entry.expiresAt.toISOString(),
        values: entry.values!,
      },
    };
  }

  private expire(sessionId: string): void {
    const entry = this.store.get(sessionId);
    if (entry) {
      clearTimeout(entry.timer);
      this.store.delete(sessionId);
    }
  }
}

export const sessionService = new SessionService();