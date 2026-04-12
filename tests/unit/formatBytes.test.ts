import { describe, expect, test } from 'vitest';
import { formatBytes } from '../../src/lib/utils/formatBytes';

describe('formatBytes', () => {
  test('handles zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  test('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  test('formats megabytes', () => {
    expect(formatBytes(50 * 1024 * 1024)).toBe('50.0 MB');
  });

  test('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  test('treats negatives as zero', () => {
    expect(formatBytes(-100)).toBe('0 B');
  });
});
