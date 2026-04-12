import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDbClient } from '$lib/server/db/client';
import { filePost, shareEntry } from '$lib/server/db/schema';
import { putFile, deleteFile } from '$lib/server/storage/r2';
import {
  categoryFromMime,
  fileUploadConstraints,
  sanitizeFileName
} from '$lib/server/validation/schemas';
import type { TimelineEntry } from '$lib/types/timeline';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user || !platform?.env) {
    throw error(401, 'unauthorized');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw error(400, 'invalid_form_data');
  }

  const fileField = formData.get('file');
  if (!(fileField instanceof File)) {
    throw error(400, 'file_field_required');
  }

  if (fileField.size === 0) {
    throw error(400, 'empty_file');
  }
  if (fileField.size > fileUploadConstraints.maxBytes) {
    throw error(413, 'payload_too_large');
  }

  const originalName = sanitizeFileName(fileField.name || 'file');
  const mimeType = fileField.type || 'application/octet-stream';
  const category = categoryFromMime(mimeType);

  const id = crypto.randomUUID();
  const r2Key = `files/${id}`;
  const createdAt = Date.now();
  const db = createDbClient(platform.env.DB);

  // 1. Stream into R2 first; if this fails nothing in D1 is touched.
  try {
    await putFile(platform.env.FILES, {
      key: r2Key,
      body: fileField.stream(),
      contentType: mimeType
    });
  } catch {
    throw error(500, 'r2_put_failed');
  }

  // 2. Insert share_entry + file_post; if either fails roll the R2 object
  //    back so we never end up with an orphaned binary.
  try {
    await db.insert(shareEntry).values({
      id,
      userId: locals.user.id,
      kind: 'file',
      createdAt
    });
    await db.insert(filePost).values({
      entryId: id,
      r2Key,
      originalName,
      mimeType,
      byteSize: fileField.size,
      category
    });
  } catch {
    await deleteFile(platform.env.FILES, r2Key).catch(() => {});
    // Also remove the share_entry row if the file_post insert is what failed.
    await db
      .delete(shareEntry)
      .where(eq(shareEntry.id, id))
      .catch(() => {});
    throw error(500, 'db_insert_failed');
  }

  const entry: TimelineEntry = {
    id,
    kind: 'file',
    createdAt,
    file: {
      originalName,
      mimeType,
      byteSize: fileField.size,
      category,
      previewUrl: `/api/files/${id}`,
      downloadUrl: `/api/files/${id}`
    }
  };
  return json(entry, { status: 201 });
};
