import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;

export function setSessionTokenCookie(
  cookies: Cookies,
  token: string,
  secure: boolean
): void {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_LIFETIME_SECONDS
  });
}

export function deleteSessionTokenCookie(cookies: Cookies, secure: boolean): void {
  cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0
  });
}

export function getSessionTokenCookie(cookies: Cookies): string | null {
  return cookies.get(SESSION_COOKIE) ?? null;
}
