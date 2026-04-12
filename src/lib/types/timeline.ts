// Shared TimelineEntry types used by both UI components and (later) the
// server-side data loader. Phase B will produce values matching this shape
// from D1 + R2 lookups.

export type EntryKind = 'text' | 'file' | 'url';
export type FileCategory = 'image' | 'video' | 'other';
export type OgpStatus = 'pending' | 'success' | 'failed';

export interface TextPayload {
  body: string;
}

export interface FilePayload {
  originalName: string;
  mimeType: string;
  byteSize: number;
  category: FileCategory;
  /** Mock data may inline a preview URL. Phase B uses /api/files/[id]. */
  previewUrl: string | null;
  downloadUrl: string;
}

export interface OgpData {
  status: OgpStatus;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
}

export interface UrlPayload {
  url: string;
  domain: string;
  ogp: OgpData;
}

interface BaseEntry {
  id: string;
  createdAt: number;
}

export type TimelineEntry =
  | (BaseEntry & { kind: 'text'; text: TextPayload })
  | (BaseEntry & { kind: 'file'; file: FilePayload })
  | (BaseEntry & { kind: 'url'; url: UrlPayload });

export type EntryFilterKind = 'all' | EntryKind;
