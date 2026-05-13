import type {
  CreateFormRequest,
  CreateFormResponse,
  EncryptedSessionResponse,
  SessionEntry,
  SessionResponse
} from '../types/index.js';
import { encrypt } from '../utils/encryption.js';

interface SessionStats {
  activeSessions: number;
  sessionsToday: number;
  sessionsWeek: number;
  sessionsMonth: number;
  totalSessions: number;
}

export class SessionService {
  private store = new Map<string, SessionEntry>();
  private stats = {
    created: 0,
    submitted: 0,
    creationTimes: [] as Date[],
  };

  create(req: CreateFormRequest, baseUrl: string): CreateFormResponse | { error: 'DUPLICATE' } {
    if (this.store.has(req.sessionId)) {
      return { error: 'DUPLICATE' };
    }

    const now = new Date();

    this.stats.created++;
    this.stats.creationTimes.push(now);
    const timeoutSeconds = req.timeoutSeconds ?? 60;
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
      seed: req.seed,
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

    if (entry.submittedAt !== null) {
      return { error: 'ALREADY_SUBMITTED' };
    }

    if (entry.seed) {
      entry.encryptedData = encrypt(values, entry.seed);
      delete entry.seed;
    }

    entry.values = values;
    entry.submittedAt = new Date();
    clearTimeout(entry.timer);
    this.stats.submitted++;

    return { ok: true };
  }

  getResult(sessionId: string): { status: 'NOT_FOUND' | 'EXPIRED' | 'NOT_SUBMITTED' } | { status: 'OK'; data: SessionResponse | EncryptedSessionResponse } {
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

    if (entry.encryptedData) {
      return {
        status: 'OK',
        data: { encryptedData: entry.encryptedData },
      };
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

  getStats(): SessionStats {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let sessionsDay = 0;
    let sessionsWeek = 0;
    let sessionsMonth = 0;
    let activeCount = 0;

    for (const entry of this.store.values()) {
      if (entry.expiresAt > now) activeCount++;
    }

    for (const createdAt of this.stats.creationTimes) {
      if (createdAt >= startOfDay) sessionsDay++;
      if (createdAt >= startOfWeek) sessionsWeek++;
      if (createdAt >= startOfMonth) sessionsMonth++;
    }

    return {
      activeSessions: activeCount,
      sessionsToday: sessionsDay,
      sessionsWeek: sessionsWeek,
      sessionsMonth: sessionsMonth,
      totalSessions: this.stats.created,
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