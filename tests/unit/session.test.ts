import { describe, expect, test } from 'vitest';
import { generateSessionToken, hashSessionToken } from '../../src/lib/server/auth/session';

describe('generateSessionToken', () => {
  test('produces a non-empty lowercase base32 string', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[a-z2-7]+$/);
    expect(token.length).toBeGreaterThan(20);
  });

  test('produces unique values across calls', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 50; i += 1) tokens.add(generateSessionToken());
    expect(tokens.size).toBe(50);
  });
});

describe('hashSessionToken', () => {
  test('is deterministic for the same input', () => {
    const token = 'a-known-fixed-token-value';
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  test('returns different hashes for different tokens', () => {
    expect(hashSessionToken('one')).not.toBe(hashSessionToken('two'));
  });

  test('returns a 64-character lowercase hex SHA-256', () => {
    const hash = hashSessionToken('something');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('is not equal to the plaintext token', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
