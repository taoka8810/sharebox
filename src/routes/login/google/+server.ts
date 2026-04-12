import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { createGoogleProvider } from '$lib/server/auth/google';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  if (!platform?.env) {
    throw error(500, 'Cloudflare bindings not available');
  }

  const google = createGoogleProvider(platform.env, url.origin);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const authUrl = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email'
  ]);

  const secure = platform.env.SESSION_COOKIE_SECURE === 'true';
  const tenMinutes = 60 * 10;

  cookies.set('google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: tenMinutes
  });

  cookies.set('google_code_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: tenMinutes
  });

  throw redirect(302, authUrl.toString());
};
