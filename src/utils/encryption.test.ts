import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption.js';

describe('encryption', () => {
  it('encrypts and decrypts an object', () => {
    const data = { name: 'Alice', email: 'alice@example.com' };
    const seed = 'my-secret-key';

    const encoded = encrypt(data, seed);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');

    const decrypted = decrypt(encoded, seed);
    expect(JSON.parse(decrypted)).toEqual(data);
  });

  it('encrypts and decrypts a string', () => {
    const data = 'sensitive data';
    const seed = 'another-key';

    const encoded = encrypt(data, seed);
    const decrypted = decrypt(encoded, seed);
    expect(decrypted).toBe(data);
  });

  it('produces different ciphertext each time', () => {
    const data = { msg: 'hello' };
    const seed = 'key';

    const a = encrypt(data, seed);
    const b = encrypt(data, seed);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with wrong seed', () => {
    const data = { secret: 42 };
    const encoded = encrypt(data, 'correct-seed');

    expect(() => decrypt(encoded, 'wrong-seed')).toThrow();
  });

  it('fails on tampered data', () => {
    const data = { foo: 'bar' };
    const encoded = encrypt(data, 'key');

    const raw = Buffer.from(encoded, 'base64').toString('utf-8');
    const payload = JSON.parse(raw);
    payload.data = Buffer.from('tampered', 'utf-8').toString('base64');
    const tampered = Buffer.from(JSON.stringify(payload)).toString('base64');

    expect(() => decrypt(tampered, 'key')).toThrow();
  });
});
