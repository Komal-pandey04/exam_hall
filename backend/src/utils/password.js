import crypto from 'node:crypto';

const KEYLEN = 64;

/** scrypt hash stored as "scrypt$<salt hex>$<hash hex>". */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');
