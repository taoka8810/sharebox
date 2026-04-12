import { redirect, type RequestHandler } from '@sveltejs/kit';
import { createDbClient } from '$lib/server/db/client';
import { invalidateSession } from '$lib/server/auth/session';
import { deleteSessionTokenCookie, getSessionTokenCookie } from '$lib/server/auth/cookies';

export const POST: RequestHandler = async ({ cookies, platform }) => {
  if (platform?.env) {
    const token = getSessionTokenCookie(cookies);
    if (token) {
      const db = createDbClient(platform.env.DB);
      await invalidateSession(db, token);
    }
    const secure = platform.env.SESSION_COOKIE_SECURE === 'true';
    deleteSessionTokenCookie(cookies, secure);
  }
  throw redirect(302, '/login');
};
