import { describe, expect, test } from 'vitest';
import { isAllowedEmail } from '../../src/lib/server/auth/whitelist';

const OWNER = 'owner@example.com';

describe('isAllowedEmail', () => {
  test('accepts the exact owner email', () => {
    expect(isAllowedEmail('owner@example.com', OWNER)).toBe(true);
  });

  test('rejects a different email', () => {
    expect(isAllowedEmail('intruder@example.com', OWNER)).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isAllowedEmail('Owner@Example.com', OWNER)).toBe(true);
    expect(isAllowedEmail('OWNER@EXAMPLE.COM', OWNER)).toBe(true);
  });

  test('trims whitespace', () => {
    expect(isAllowedEmail('  owner@example.com  ', OWNER)).toBe(true);
  });

  test('rejects null / undefined / empty inputs', () => {
    expect(isAllowedEmail(null, OWNER)).toBe(false);
    expect(isAllowedEmail(undefined, OWNER)).toBe(false);
    expect(isAllowedEmail('', OWNER)).toBe(false);
  });

  test('rejects when owner is empty', () => {
    expect(isAllowedEmail('owner@example.com', '')).toBe(false);
  });
});
