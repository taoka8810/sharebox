import { describe, expect, test } from 'vitest';
import { parseOgp } from '../../src/lib/server/ogp/fetcher';

describe('parseOgp', () => {
  test('extracts all four og:* fields when present', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Hello World" />
        <meta property="og:description" content="A short description" />
        <meta property="og:image" content="https://example.com/image.png" />
        <meta property="og:site_name" content="Example Site" />
      </head></html>
    `;
    expect(parseOgp(html)).toEqual({
      title: 'Hello World',
      description: 'A short description',
      imageUrl: 'https://example.com/image.png',
      siteName: 'Example Site'
    });
  });

  test('returns null fields for missing meta tags', () => {
    const html = '<html><head><title>nothing</title></head></html>';
    expect(parseOgp(html)).toEqual({
      title: null,
      description: null,
      imageUrl: null,
      siteName: null
    });
  });

  test('falls back to name="og:*" attributes', () => {
    const html = `
      <html><head>
        <meta name="og:title" content="With name attribute" />
      </head></html>
    `;
    expect(parseOgp(html).title).toBe('With name attribute');
  });

  test('trims whitespace and treats empty content as null', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="  spaced  " />
        <meta property="og:description" content="" />
      </head></html>
    `;
    const data = parseOgp(html);
    expect(data.title).toBe('spaced');
    expect(data.description).toBeNull();
  });
});
