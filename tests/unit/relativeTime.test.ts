import { describe, expect, test } from 'vitest';
import { formatRelativeTime } from '../../src/lib/utils/relativeTime';

const NOW = 1_700_000_000_000;

describe('formatRelativeTime', () => {
  test('shows "たった今" for fresh timestamps', () => {
    expect(formatRelativeTime(NOW - 5_000, NOW)).toBe('たった今');
    expect(formatRelativeTime(NOW, NOW)).toBe('たった今');
  });

  test('shows minutes', () => {
    expect(formatRelativeTime(NOW - 3 * 60_000, NOW)).toBe('3 分前');
  });

  test('shows hours', () => {
    expect(formatRelativeTime(NOW - 5 * 60 * 60_000, NOW)).toBe('5 時間前');
  });

  test('shows yesterday between 24h and 48h', () => {
    expect(formatRelativeTime(NOW - 30 * 60 * 60_000, NOW)).toBe('昨日');
  });

  test('shows days within a week', () => {
    expect(formatRelativeTime(NOW - 3 * 24 * 60 * 60_000, NOW)).toBe('3 日前');
  });

  test('shows weeks within a month', () => {
    expect(formatRelativeTime(NOW - 14 * 24 * 60 * 60_000, NOW)).toBe('2 週間前');
  });

  test('falls back to "たった今" for timestamps in the future', () => {
    expect(formatRelativeTime(NOW + 60_000, NOW)).toBe('たった今');
  });
});
