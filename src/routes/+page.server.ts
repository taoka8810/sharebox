import { redirect } from '@sveltejs/kit';
import { createDbClient } from '$lib/server/db/client';
import { loadTimeline } from '$lib/server/db/timeline';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  if (!platform?.env) {
    return { entries: [] };
  }
  const db = createDbClient(platform.env.DB);
  const entries = await loadTimeline(db, { userId: locals.user.id });
  return { entries };
};
