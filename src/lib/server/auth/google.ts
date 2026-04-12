import { Google } from 'arctic';

/**
 * Build the Arctic Google OAuth provider for the current request.
 *
 * The redirect URI is derived from the incoming request's origin so the same
 * code path works for `http://localhost:5173`, `wrangler pages dev`, and the
 * production `*.pages.dev` deployment without per-environment branching.
 */
export function createGoogleProvider(
  env: { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string },
  origin: string
): Google {
  const redirectUri = `${origin}/login/google/callback`;
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
}
