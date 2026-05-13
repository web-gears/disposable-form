import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(seed: string, salt: Buffer): Buffer {
  return crypto.scryptSync(seed, salt, KEY_LENGTH);
}

export function encrypt(data: object | string, seed: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(seed, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decrypt(encoded: string, seed: string): string {
  const raw = Buffer.from(encoded, 'base64').toString('utf-8');
  const payload = JSON.parse(raw) as { salt: string; iv: string; tag: string; data: string };
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');
  const key = deriveKey(seed, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = decipher.update(encrypted) + decipher.final('utf-8');
  return decrypted;
}
