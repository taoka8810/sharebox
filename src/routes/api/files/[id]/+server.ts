import { error, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { createDbClient } from '$lib/server/db/client';
import { filePost, shareEntry } from '$lib/server/db/schema';
import { getFile } from '$lib/server/storage/r2';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
  if (!locals.user || !platform?.env) {
    throw error(401, 'unauthorized');
  }
  const id = params.id;
  if (!id) {
    throw error(400, 'invalid_id');
  }

  const db = createDbClient(platform.env.DB);

  // Confirm ownership before touching R2.
  const row = await db
    .select({ file: filePost, entry: shareEntry })
    .from(shareEntry)
    .innerJoin(filePost, eq(filePost.entryId, shareEntry.id))
    .where(and(eq(shareEntry.id, id), eq(shareEntry.userId, locals.user.id)))
    .get();

  if (!row) {
    throw error(404, 'not_found');
  }

  const obj = await getFile(platform.env.FILES, row.file.r2Key);
  if (!obj || !obj.body) {
    throw error(404, 'object_missing');
  }

  // Use `inline` so the same URL works for the inline image/video preview
  // tags. The HTML5 download attribute on the FileEntry anchor still forces
  // a download when the user explicitly clicks the DL link.
  const safeName = encodeURIComponent(row.file.originalName);
  return new Response(obj.body, {
    status: 200,
    headers: {
      'content-type': row.file.mimeType,
      'content-length': String(row.file.byteSize),
      'content-disposition': `inline; filename*=UTF-8''${safeName}`,
      'cache-control': 'private, max-age=0'
    }
  });
};
