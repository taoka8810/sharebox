import { describe, expect, test } from 'vitest';
import {
  TEXT_MAX_CHARS,
  categoryFromMime,
  fileUploadConstraints,
  sanitizeFileName,
  textPostSchema,
  urlPostSchema
} from '../../src/lib/server/validation/schemas';

describe('textPostSchema', () => {
  test('accepts a normal body', () => {
    const result = textPostSchema.safeParse({ body: 'hello world' });
    expect(result.success).toBe(true);
  });

  test('rejects an empty body', () => {
    expect(textPostSchema.safeParse({ body: '' }).success).toBe(false);
  });

  test('rejects a whitespace-only body', () => {
    expect(textPostSchema.safeParse({ body: '   \n\t  ' }).success).toBe(false);
  });

  test('rejects a body that exceeds the character cap', () => {
    const tooLong = 'a'.repeat(TEXT_MAX_CHARS + 1);
    expect(textPostSchema.safeParse({ body: tooLong }).success).toBe(false);
  });

  test('accepts a body exactly at the cap', () => {
    const justRight = 'a'.repeat(TEXT_MAX_CHARS);
    expect(textPostSchema.safeParse({ body: justRight }).success).toBe(true);
  });
});

describe('urlPostSchema', () => {
  test('accepts http URLs', () => {
    expect(urlPostSchema.safeParse({ url: 'http://example.com' }).success).toBe(true);
  });

  test('accepts https URLs with paths', () => {
    expect(urlPostSchema.safeParse({ url: 'https://example.com/foo/bar?x=1' }).success).toBe(true);
  });

  test('rejects ftp URLs', () => {
    expect(urlPostSchema.safeParse({ url: 'ftp://example.com' }).success).toBe(false);
  });

  test('rejects malformed URLs', () => {
    expect(urlPostSchema.safeParse({ url: 'not a url' }).success).toBe(false);
  });

  test('rejects empty input', () => {
    expect(urlPostSchema.safeParse({ url: '' }).success).toBe(false);
  });

  test('rejects URLs over 2048 chars', () => {
    const long = 'https://example.com/' + 'a'.repeat(2048);
    expect(urlPostSchema.safeParse({ url: long }).success).toBe(false);
  });
});

describe('categoryFromMime', () => {
  test('classifies images', () => {
    expect(categoryFromMime('image/png')).toBe('image');
    expect(categoryFromMime('image/jpeg')).toBe('image');
  });

  test('classifies videos', () => {
    expect(categoryFromMime('video/mp4')).toBe('video');
  });

  test('falls through to other', () => {
    expect(categoryFromMime('application/pdf')).toBe('other');
    expect(categoryFromMime('application/zip')).toBe('other');
    expect(categoryFromMime('')).toBe('other');
  });
});

describe('sanitizeFileName', () => {
  test('strips path components', () => {
    expect(sanitizeFileName('/etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('C:\\Users\\me\\photo.jpg')).toBe('photo.jpg');
  });

  test('collapses whitespace and trims', () => {
    expect(sanitizeFileName('  multiple   spaces.txt  ')).toBe('multiple spaces.txt');
  });
});

describe('fileUploadConstraints', () => {
  test('exposes the 50 MB cap as a constant', () => {
    expect(fileUploadConstraints.maxBytes).toBe(50 * 1024 * 1024);
  });
});
