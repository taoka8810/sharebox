import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDbClient } from '$lib/server/db/client';
import { shareEntry, urlPost } from '$lib/server/db/schema';
import { urlPostSchema } from '$lib/server/validation/schemas';
import { fetchOgp } from '$lib/server/ogp/fetcher';
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

  const parsed = urlPostSchema.safeParse(payload);
  if (!parsed.success) {
    throw error(400, parsed.error.issues[0]?.message ?? 'validation_failed');
  }

  const trimmedUrl = parsed.data.url.trim();
  const parsedUrl = new URL(trimmedUrl);
  const domain = parsedUrl.hostname;

  const db = createDbClient(platform.env.DB);
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  await db.insert(shareEntry).values({
    id,
    userId: locals.user.id,
    kind: 'url',
    createdAt
  });
  await db.insert(urlPost).values({
    entryId: id,
    url: trimmedUrl,
    domain,
    ogpStatus: 'pending'
  });

  // Fetch OGP synchronously inside the request. The fetcher caps itself at
  // five seconds and gracefully degrades to status:'failed' for any error
  // path so this never blocks the response indefinitely.
  const result = await fetchOgp(trimmedUrl);
  const fetchedAt = Date.now();

  if (result.status === 'success' && result.data) {
    await db
      .update(urlPost)
      .set({
        ogpStatus: 'success',
        ogpTitle: result.data.title,
        ogpDescription: result.data.description,
        ogpImageUrl: result.data.imageUrl,
        ogpSiteName: result.data.siteName,
        ogpFetchedAt: fetchedAt
      })
      .where(eq(urlPost.entryId, id));
  } else {
    await db
      .update(urlPost)
      .set({ ogpStatus: 'failed', ogpFetchedAt: fetchedAt })
      .where(eq(urlPost.entryId, id));
  }

  const entry: TimelineEntry = {
    id,
    kind: 'url',
    createdAt,
    url: {
      url: trimmedUrl,
      domain,
      ogp:
        result.status === 'success' && result.data
          ? {
              status: 'success',
              title: result.data.title,
              description: result.data.description,
              imageUrl: result.data.imageUrl,
              siteName: result.data.siteName
            }
          : { status: 'failed' }
    }
  };
  return json(entry, { status: 201 });
};
