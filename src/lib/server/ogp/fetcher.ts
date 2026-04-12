import { parse as parseHtml } from 'node-html-parser';

const OGP_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 256 * 1024;

export interface OgpData {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export interface OgpFetchResult {
  status: 'success' | 'failed';
  data: OgpData | null;
}

/**
 * Parse a chunk of HTML and extract og:* meta tags. Pure function so it can
 * be tested without doing real network requests.
 */
export function parseOgp(html: string): OgpData {
  const root = parseHtml(html);
  const meta = (property: string): string | null => {
    const node =
      root.querySelector(`meta[property="${property}"]`) ??
      root.querySelector(`meta[name="${property}"]`);
    if (!node) return null;
    const content = node.getAttribute('content');
    return content ? content.trim() || null : null;
  };

  return {
    title: meta('og:title'),
    description: meta('og:description'),
    imageUrl: meta('og:image'),
    siteName: meta('og:site_name')
  };
}

/**
 * Fetch the target URL with a 5-second timeout, read at most the first
 * 256 KB of the body, and run the OGP parser on the result. Network and
 * parser errors degrade gracefully to a `failed` result so the caller can
 * fall back to the URL-only display required by FR-028.
 */
export async function fetchOgp(url: string): Promise<OgpFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OGP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'sharebox-ogp/1.0 (+https://github.com/personal/sharebox)'
      }
    });
    if (!response.ok) {
      return { status: 'failed', data: null };
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return { status: 'failed', data: null };
    }
    const html = await readBoundedText(response);
    const parsed = parseOgp(html);
    if (!parsed.title && !parsed.description && !parsed.imageUrl && !parsed.siteName) {
      return { status: 'failed', data: null };
    }
    return { status: 'success', data: parsed };
  } catch {
    return { status: 'failed', data: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function readBoundedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let received = 0;
  let html = '';
  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (received >= MAX_HTML_BYTES) {
      await reader.cancel();
      break;
    }
  }
  html += decoder.decode();
  return html;
}
