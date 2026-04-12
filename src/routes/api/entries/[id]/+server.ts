import { error, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { createDbClient } from '$lib/server/db/client';
import { filePost, shareEntry } from '$lib/server/db/schema';
import { deleteFile } from '$lib/server/storage/r2';

/**
 * Unified entry delete endpoint. Removes the share_entry row (cascade
 * deletes the per-kind sub-table row) and, when the entry was a file,
 * removes the underlying R2 object on a best-effort basis.
 *
 * Implements both T077 (the share_entry delete) and T086 (the R2 cleanup
 * branch for kind=file) on the same handler.
 */
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  if (!locals.user || !platform?.env) {
    throw error(401, 'unauthorized');
  }
  const id = params.id;
  if (!id) {
    throw error(400, 'invalid_id');
  }

  const db = createDbClient(platform.env.DB);

  const entry = await db
    .select()
    .from(shareEntry)
    .where(and(eq(shareEntry.id, id), eq(shareEntry.userId, locals.user.id)))
    .get();

  if (!entry) {
    throw error(404, 'not_found');
  }

  if (entry.kind === 'file') {
    const file = await db.select().from(filePost).where(eq(filePost.entryId, id)).get();
    if (file?.r2Key) {
      try {
        await deleteFile(platform.env.FILES, file.r2Key);
      } catch {
        // best-effort: log via console and continue with the DB delete so
        // the timeline reflects the user's intent immediately.
        console.warn(`Failed to delete R2 object ${file.r2Key}`);
      }
    }
  }

  // FK cascades remove text_post / file_post / url_post automatically.
  await db
    .delete(shareEntry)
    .where(and(eq(shareEntry.id, id), eq(shareEntry.userId, locals.user.id)));

  return new Response(null, { status: 204 });
};
