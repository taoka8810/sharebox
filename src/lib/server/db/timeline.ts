import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import type { Db } from './client';
import { filePost, shareEntry, textPost, urlPost } from './schema';
import type { TimelineEntry } from '$lib/types/timeline';

const DEFAULT_LIMIT = 100;

export interface LoadTimelineOptions {
  userId: string;
  before?: number;
  limit?: number;
}

/**
 * Load the owner's timeline from D1 in chronological order (oldest first),
 * which is what the chat-style UI consumes. Per-kind sub-tables are joined
 * in JavaScript so each query stays simple and the overall round-trip count
 * never exceeds four.
 */
export async function loadTimeline(
  db: Db,
  { userId, before, limit = DEFAULT_LIMIT }: LoadTimelineOptions
): Promise<TimelineEntry[]> {
  const conditions = [eq(shareEntry.userId, userId)];
  if (before !== undefined) {
    conditions.push(lt(shareEntry.createdAt, before));
  }

  const baseRows = await db
    .select()
    .from(shareEntry)
    .where(and(...conditions))
    .orderBy(desc(shareEntry.createdAt))
    .limit(limit);

  if (baseRows.length === 0) return [];

  const ids = baseRows.map((row) => row.id);

  const [textRows, fileRows, urlRows] = await Promise.all([
    db.select().from(textPost).where(inArray(textPost.entryId, ids)),
    db.select().from(filePost).where(inArray(filePost.entryId, ids)),
    db.select().from(urlPost).where(inArray(urlPost.entryId, ids))
  ]);

  const textMap = new Map(textRows.map((row) => [row.entryId, row]));
  const fileMap = new Map(fileRows.map((row) => [row.entryId, row]));
  const urlMap = new Map(urlRows.map((row) => [row.entryId, row]));

  // Build TimelineEntry objects in oldest-first order so the chat view does
  // not need to reverse the array client-side.
  const entries: TimelineEntry[] = [];
  for (const row of [...baseRows].reverse()) {
    if (row.kind === 'text') {
      const text = textMap.get(row.id);
      if (!text) continue;
      entries.push({
        id: row.id,
        kind: 'text',
        createdAt: row.createdAt,
        text: { body: text.body }
      });
    } else if (row.kind === 'file') {
      const file = fileMap.get(row.id);
      if (!file) continue;
      entries.push({
        id: row.id,
        kind: 'file',
        createdAt: row.createdAt,
        file: {
          originalName: file.originalName,
          mimeType: file.mimeType,
          byteSize: file.byteSize,
          category: file.category,
          previewUrl: `/api/files/${row.id}`,
          downloadUrl: `/api/files/${row.id}`
        }
      });
    } else if (row.kind === 'url') {
      const url = urlMap.get(row.id);
      if (!url) continue;
      entries.push({
        id: row.id,
        kind: 'url',
        createdAt: row.createdAt,
        url: {
          url: url.url,
          domain: url.domain,
          ogp: {
            status: url.ogpStatus,
            title: url.ogpTitle,
            description: url.ogpDescription,
            imageUrl: url.ogpImageUrl,
            siteName: url.ogpSiteName
          }
        }
      });
    }
  }
  return entries;
}
