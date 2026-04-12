import { error, json, type RequestHandler } from '@sveltejs/kit';
import { createDbClient } from '$lib/server/db/client';
import { textPostSchema } from '$lib/server/validation/schemas';
import { shareEntry, textPost } from '$lib/server/db/schema';
import type { TimelineEntry } from '$lib/types/timeline';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.user || !platform?.env) {
    throw error(401, 'unauthorized');
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw error(400, 'invalid_json');
  }

  const parsed = textPostSchema.safeParse(payload);
  if (!parsed.success) {
    throw error(400, parsed.error.issues[0]?.message ?? 'validation_failed');
  }

  const body = parsed.data.body.trim();
  const byteLength = new TextEncoder().encode(body).length;

  const db = createDbClient(platform.env.DB);
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await db.insert(shareEntry).values({
    id,
    userId: locals.user.id,
    kind: 'text',
    createdAt
  });
  await db.insert(textPost).values({
    entryId: id,
    body,
    byteLength
  });

  const entry: TimelineEntry = {
    id,
    kind: 'text',
    createdAt,
    text: { body }
  };
  return json(entry, { status: 201 });
};
