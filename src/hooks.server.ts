import { redirect, type Handle } from '@sveltejs/kit';
import { createDbClient } from '$lib/server/db/client';
import {
  deleteSessionTokenCookie,
  getSessionTokenCookie,
  setSessionTokenCookie
} from '$lib/server/auth/cookies';
import { validateSessionToken } from '$lib/server/auth/session';

const PUBLIC_PATHS = ['/login', '/login/google', '/login/google/callback', '/denied'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const handle: Handle = async ({ event, resolve }) => {
  // Cloudflare Pages binds D1 / R2 / secrets via event.platform.env. The
  // bindings are absent during `vite dev` (no wrangler), in which case we
  // serve only the public routes and skip session resolution entirely so the
  // UI is still browsable for design review.
  const env = event.platform?.env;
  if (!env) {
    event.locals.user = null;
    if (!isPublicPath(event.url.pathname)) {
      throw redirect(302, '/login');
    }
    return resolve(event);
  }

  const secure = env.SESSION_COOKIE_SECURE === 'true';
  const token = getSessionTokenCookie(event.cookies);

  if (token) {
    const db = createDbClient(env.DB);
    const { user } = await validateSessionToken(db, token);
    if (user) {
      event.locals.user = user;
      // Touch the cookie so the sliding-expiration in validateSessionToken
      // gets persisted browser-side as well.
      setSessionTokenCookie(event.cookies, token, secure);
    } else {
      event.locals.user = null;
      deleteSessionTokenCookie(event.cookies, secure);
    }
  } else {
    event.locals.user = null;
  }

  if (!event.locals.user && !isPublicPath(event.url.pathname)) {
    if (event.url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: { code: 'unauthorized', message: 'Authentication required' } }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    throw redirect(302, '/login');
  }

  return resolve(event);
};
