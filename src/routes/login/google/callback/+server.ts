import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { decodeIdToken, type OAuth2Tokens } from 'arctic';
import { eq } from 'drizzle-orm';
import { createDbClient } from '$lib/server/db/client';
import { createGoogleProvider } from '$lib/server/auth/google';
import { isAllowedEmail } from '$lib/server/auth/whitelist';
import { createSession, generateSessionToken, type SessionUser } from '$lib/server/auth/session';
import { setSessionTokenCookie } from '$lib/server/auth/cookies';
import { recordLoginAttempt } from '$lib/server/audit';
import { user as userTable } from '$lib/server/db/schema';

interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export const GET: RequestHandler = async ({ url, cookies, request, platform }) => {
  if (!platform?.env) {
    throw error(500, 'Cloudflare bindings not available');
  }

  const env = platform.env;
  const db = createDbClient(env.DB);
  const secure = env.SESSION_COOKIE_SECURE === 'true';
  const clientIp = request.headers.get('cf-connecting-ip');
  const userAgent = request.headers.get('user-agent');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state') ?? null;
  const codeVerifier = cookies.get('google_code_verifier') ?? null;

  // Always clear the temporary OAuth cookies regardless of the outcome.
  cookies.delete('google_oauth_state', { path: '/' });
  cookies.delete('google_code_verifier', { path: '/' });

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    await recordLoginAttempt(db, {
      email: null,
      result: 'denied_invalid_state',
      clientIp,
      userAgent
    });
    throw error(400, 'Invalid OAuth state');
  }

  const google = createGoogleProvider(env, url.origin);

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    await recordLoginAttempt(db, {
      email: null,
      result: 'denied_oauth_failed',
      clientIp,
      userAgent
    });
    throw error(400, 'Failed to validate Google authorization code');
  }

  let claims: GoogleIdTokenClaims;
  try {
    claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;
  } catch {
    await recordLoginAttempt(db, {
      email: null,
      result: 'denied_oauth_failed',
      clientIp,
      userAgent
    });
    throw error(400, 'Failed to decode Google ID token');
  }

  const email = claims.email ?? null;

  if (!isAllowedEmail(email, env.OWNER_EMAIL)) {
    await recordLoginAttempt(db, {
      email,
      result: 'denied_whitelist',
      clientIp,
      userAgent
    });
    throw redirect(302, '/denied');
  }

  // Upsert the owner user row.
  const now = Date.now();
  let owner: SessionUser;
  const existing = await db
    .select()
    .from(userTable)
    .where(eq(userTable.googleSub, claims.sub))
    .get();

  if (existing) {
    await db
      .update(userTable)
      .set({
        email: email ?? existing.email,
        displayName: claims.name ?? existing.displayName,
        avatarUrl: claims.picture ?? existing.avatarUrl,
        updatedAt: now
      })
      .where(eq(userTable.id, existing.id));
    owner = {
      id: existing.id,
      email: email ?? existing.email,
      displayName: claims.name ?? existing.displayName,
      avatarUrl: claims.picture ?? existing.avatarUrl
    };
  } else {
    const id = crypto.randomUUID();
    await db.insert(userTable).values({
      id,
      googleSub: claims.sub,
      email: email!,
      displayName: claims.name ?? null,
      avatarUrl: claims.picture ?? null,
      createdAt: now,
      updatedAt: now
    });
    owner = {
      id,
      email: email!,
      displayName: claims.name ?? null,
      avatarUrl: claims.picture ?? null
    };
  }

  const token = generateSessionToken();
  await createSession(db, token, owner.id);
  setSessionTokenCookie(cookies, token, secure);

  await recordLoginAttempt(db, {
    email,
    result: 'success',
    clientIp,
    userAgent
  });

  throw redirect(302, '/');
};
