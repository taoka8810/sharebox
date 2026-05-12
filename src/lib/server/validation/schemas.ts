import { z } from 'zod';

export const TEXT_MAX_CHARS = 100_000;
// Sits just under Cloudflare Workers' 100 MB request-body cap (Free plan)
// so the multipart envelope still fits. Raise alongside the plan if we
// upgrade to Paid (500 MB cap).
export const FILE_MAX_BYTES = 99 * 1024 * 1024;

export const textPostSchema = z.object({
  body: z
    .string()
    .min(1, '本文は必須です')
    .refine((v) => v.trim().length > 0, '空白のみの投稿はできません')
    .refine((v) => v.length <= TEXT_MAX_CHARS, `${TEXT_MAX_CHARS} 文字を超えています`)
});
export type TextPostInput = z.infer<typeof textPostSchema>;

export const urlPostSchema = z.object({
  url: z
    .string()
    .min(1, 'URL は必須です')
    .max(2048, 'URL が長すぎます')
    .refine((value) => {
      try {
        const parsed = new URL(value.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'http(s) スキームの URL を入力してください')
});
export type UrlPostInput = z.infer<typeof urlPostSchema>;

/**
 * File uploads are streamed and validated procedurally rather than via a
 * zod schema, but we expose the constants from one module so the limits stay
 * in sync between the API handler and the unit tests.
 */
export const fileUploadConstraints = {
  maxBytes: FILE_MAX_BYTES
} as const;

export function categoryFromMime(mime: string): 'image' | 'video' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}

export function sanitizeFileName(name: string): string {
  // Drop directory components for safety; collapse repeated whitespace.
  const base = name.split(/[\\/]/).pop() ?? name;
  return base.replace(/\s+/g, ' ').trim();
}
