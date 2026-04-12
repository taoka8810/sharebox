// Mock timeline data used during Phase A (UI implementation).
// Replaced in Phase B (backend wiring) by real data loaded from D1.
//
// Each entry uses a deterministic createdAt offset relative to a fixed
// "now" reference so the relative-time formatting can be exercised across
// the full range (just now / minutes / hours / yesterday / days / weeks).

import type { TimelineEntry } from '$lib/types/timeline';

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const mockTimeline: TimelineEntry[] = [
  {
    id: 'mock-text-1',
    kind: 'text',
    createdAt: NOW - 2 * MIN,
    text: {
      body: 'sharebox の実装メモ: Phase A の UI を全部触れるようにしてからレビューに回す。'
    }
  },
  {
    id: 'mock-url-1',
    kind: 'url',
    createdAt: NOW - 18 * MIN,
    url: {
      url: 'https://kit.svelte.dev/docs/introduction',
      domain: 'kit.svelte.dev',
      ogp: {
        status: 'success',
        title: 'Introduction • SvelteKit documentation',
        description:
          'SvelteKit is a framework for rapidly developing robust, performant web applications using Svelte.',
        imageUrl: 'https://kit.svelte.dev/images/svelte-kit.png',
        siteName: 'SvelteKit'
      }
    }
  },
  {
    id: 'mock-file-image-1',
    kind: 'file',
    createdAt: NOW - 47 * MIN,
    file: {
      originalName: 'workspace.jpg',
      mimeType: 'image/jpeg',
      byteSize: 2_134_567,
      category: 'image',
      previewUrl:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=60',
      downloadUrl: '#mock-download-image-1'
    }
  },
  {
    id: 'mock-text-2',
    kind: 'text',
    createdAt: NOW - 3 * HOUR,
    text: {
      body: '会議室予約のリンク:\nhttps://example.invalid/booking/12345\nパスコード 4242'
    }
  },
  {
    id: 'mock-file-video-1',
    kind: 'file',
    createdAt: NOW - 5 * HOUR,
    file: {
      originalName: 'screen-recording.mp4',
      mimeType: 'video/mp4',
      byteSize: 47_300_000,
      category: 'video',
      previewUrl:
        'https://download.samplelib.com/mp4/sample-5s.mp4',
      downloadUrl: '#mock-download-video-1'
    }
  },
  {
    id: 'mock-file-pdf-1',
    kind: 'file',
    createdAt: NOW - 7 * HOUR,
    file: {
      originalName: 'design-spec.pdf',
      mimeType: 'application/pdf',
      byteSize: 1_456_000,
      category: 'other',
      previewUrl: null,
      downloadUrl: '#mock-download-pdf-1'
    }
  },
  {
    id: 'mock-url-2',
    kind: 'url',
    createdAt: NOW - 1 * DAY,
    url: {
      url: 'https://developers.cloudflare.com/r2/',
      domain: 'developers.cloudflare.com',
      ogp: {
        status: 'success',
        title: 'Cloudflare R2 · Cloudflare R2 docs',
        description:
          'Object storage with no egress fees. Cloudflare R2 is built for developers.',
        imageUrl: null,
        siteName: 'Cloudflare Docs'
      }
    }
  },
  {
    id: 'mock-text-3',
    kind: 'text',
    createdAt: NOW - 1 * DAY - 3 * HOUR,
    text: {
      body: 'export PATH="/opt/homebrew/bin:$PATH"'
    }
  },
  {
    id: 'mock-file-image-2',
    kind: 'file',
    createdAt: NOW - 2 * DAY,
    file: {
      originalName: 'mobile-mock.png',
      mimeType: 'image/png',
      byteSize: 845_000,
      category: 'image',
      previewUrl:
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=60',
      downloadUrl: '#mock-download-image-2'
    }
  },
  {
    id: 'mock-url-3',
    kind: 'url',
    createdAt: NOW - 3 * DAY,
    url: {
      url: 'https://example.invalid/no-ogp',
      domain: 'example.invalid',
      ogp: { status: 'failed' }
    }
  },
  {
    id: 'mock-file-archive-1',
    kind: 'file',
    createdAt: NOW - 5 * DAY,
    file: {
      originalName: 'old-photos.zip',
      mimeType: 'application/zip',
      byteSize: 36_900_000,
      category: 'other',
      previewUrl: null,
      downloadUrl: '#mock-download-archive-1'
    }
  },
  {
    id: 'mock-text-4',
    kind: 'text',
    createdAt: NOW - 8 * DAY,
    text: {
      body: 'GitHub PAT (read-only repo): ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  },
  {
    id: 'mock-text-5',
    kind: 'text',
    createdAt: NOW - 14 * DAY,
    text: {
      body: '今日やる: \n- design review\n- implement Phase B for US1\n- 本番デプロイの動作確認'
    }
  }
];
