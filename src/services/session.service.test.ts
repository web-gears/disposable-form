import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionService } from './session.service.js';
import { decrypt } from '../utils/encryption.js';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService();
  });

  describe('create', () => {
    it('creates a session with default timeout', () => {
      const result = service.create({ sessionId: 'test123' }, 'http://localhost:3000');

      if ('error' in result) return;
      expect(result.sessionId).toBe('test123');
      expect(result.formUrl).toBe('http://localhost:3000/test123');
      expect(result.expiresAt).toBeDefined();
    });

    it('creates a session with custom timeout', () => {
      const result = service.create({ sessionId: 'test456', timeoutSeconds: 120 }, 'http://localhost:3000');

      if ('error' in result) return;
      expect(result.sessionId).toBe('test456');
      const expiresAt = new Date(result.expiresAt);
      const now = new Date();
      expect(expiresAt.getTime() - now.getTime()).toBeGreaterThanOrEqual(119000);
    });

    it('returns error for duplicate sessionId', () => {
      service.create({ sessionId: 'dup' }, 'http://localhost:3000');
      const result = service.create({ sessionId: 'dup' }, 'http://localhost:3000');

      expect(result).toEqual({ error: 'DUPLICATE' });
    });
  });

  describe('getConfig', () => {
    it('returns config for existing session', () => {
      service.create({ sessionId: 'existing' }, 'http://localhost:3000');

      const config = service.getConfig('existing');

      expect(config).toBeDefined();
      expect(config?.config.sessionId).toBe('existing');
    });

    it('returns undefined for non-existing session', () => {
      const config = service.getConfig('notfound');

      expect(config).toBeUndefined();
    });
  });

  describe('submit', () => {
    it('submits values successfully', () => {
      service.create({ sessionId: 'submit1' }, 'http://localhost:3000');

      const result = service.submit('submit1', { name: 'test' });

      expect(result).toEqual({ ok: true });
    });

    it('returns error for non-existing session', () => {
      const result = service.submit('notfound', { name: 'test' });

      expect(result).toEqual({ error: 'NOT_FOUND' });
    });

    it('returns error for already submitted session', () => {
      service.create({ sessionId: 'double' }, 'http://localhost:3000');
      service.submit('double', { name: 'first' });

      const result = service.submit('double', { name: 'second' });

      expect(result).toEqual({ error: 'ALREADY_SUBMITTED' });
    });
  });

  describe('getResult', () => {
    it('returns submitted data', () => {
      service.create({ sessionId: 'result1', fields: [{ id: 'name', name: 'Name', type: 'text', required: true }] }, 'http://localhost:3000');
      service.submit('result1', { name: 'Alice' });

      const result = service.getResult('result1');

      expect(result.status).toBe('OK');
      if (result.status !== 'OK') return;
      if ('encryptedData' in result.data) return;
      expect(result.data.values).toEqual({ name: 'Alice' });
      expect(result.data.sessionId).toBe('result1');
    });

    it('returns NOT_FOUND for non-existing session', () => {
      const result = service.getResult('notfound');

      expect(result.status).toBe('NOT_FOUND');
    });

    it('returns NOT_SUBMITTED for unsubmitted session', () => {
      service.create({ sessionId: 'unsubmitted' }, 'http://localhost:3000');

      const result = service.getResult('unsubmitted');

      expect(result.status).toBe('NOT_SUBMITTED');
    });
  });

  describe('getStats', () => {
    it('returns initial stats', () => {
      const stats = service.getStats();

      expect(stats.activeSessions).toBe(0);
      expect(stats.sessionsToday).toBe(0);
      expect(stats.sessionsWeek).toBe(0);
      expect(stats.sessionsMonth).toBe(0);
      expect(stats.totalSessions).toBe(0);
    });

    it('counts created sessions', () => {
      service.create({ sessionId: 's1' }, 'http://localhost:3000');
      service.create({ sessionId: 's2' }, 'http://localhost:3000');

      const stats = service.getStats();

      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(2);
    });

    it('only counts non-expired sessions as active', async () => {
      service.create({ sessionId: 'expired', timeoutSeconds: 1 }, 'http://localhost:3000');
      service.create({ sessionId: 'active', timeoutSeconds: 3600 }, 'http://localhost:3000');

      await new Promise(resolve => setTimeout(resolve, 1100));

      const stats = service.getStats();

      expect(stats.activeSessions).toBe(1);
      expect(stats.totalSessions).toBe(2);
    });
  });

  describe('has', () => {
    it('returns true for existing session', () => {
      service.create({ sessionId: 'has1' }, 'http://localhost:3000');

      expect(service.has('has1')).toBe(true);
    });

    it('returns false for non-existing session', () => {
      expect(service.has('nope')).toBe(false);
    });
  });

  describe('encrypted sessions', () => {
    it('creates a session with seed', () => {
      service.create({ sessionId: 'seed-session', seed: 'my-key' }, 'http://localhost:3000');

      const entry = service.getConfig('seed-session');
      expect(entry?.seed).toBe('my-key');
    });

    it('encrypts values on submit and discards seed', () => {
      const values = { message: 'hello', count: 42 };
      service.create({ sessionId: 'enc', seed: 'secret' }, 'http://localhost:3000');

      const submitResult = service.submit('enc', values);
      expect(submitResult).toEqual({ ok: true });

      const entry = service.getConfig('enc');
      expect(entry?.seed).toBeUndefined();
      expect(entry?.encryptedData).toBeTruthy();
      expect(typeof entry?.encryptedData).toBe('string');
    });

    it('returns encryptedData on getResult for seeded session', () => {
      const values = { name: 'Alice' };
      service.create({ sessionId: 'enc-result', seed: 'my-secret' }, 'http://localhost:3000');
      service.submit('enc-result', values);

      const result = service.getResult('enc-result');
      expect(result.status).toBe('OK');

      if (result.status === 'OK') {
        expect('encryptedData' in result.data).toBe(true);
        expect('sessionId' in result.data).toBe(false);
        const typed = result.data as { encryptedData: string };
        expect(typed.encryptedData).toBeTruthy();
      }
    });

    it('encrypted data can be decrypted with original seed', () => {
      const values = { ssn: '123-45-6789' };
      const seed = 'top-secret';
      service.create({ sessionId: 'decryptable', seed }, 'http://localhost:3000');
      service.submit('decryptable', values);

      const result = service.getResult('decryptable');
      expect(result.status).toBe('OK');

      if (result.status === 'OK') {
        const typed = result.data as { encryptedData: string };
        const decrypted = JSON.parse(decrypt(typed.encryptedData, seed));
        expect(decrypted).toEqual(values);
      }
    });

    it('returns normal result for non-seeded session', () => {
      const values = { name: 'Bob' };
      service.create({ sessionId: 'normal-result' }, 'http://localhost:3000');
      service.submit('normal-result', values);

      const result = service.getResult('normal-result');
      expect(result.status).toBe('OK');

      if (result.status === 'OK') {
        expect('values' in result.data).toBe(true);
        expect((result.data as { values: unknown }).values).toEqual(values);
      }
    });
  });
});