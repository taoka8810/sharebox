import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { session, user, type Session, type User } from '../db/schema';

const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_LIFETIME_MS = 30 * DAY_MS;
const SESSION_REFRESH_THRESHOLD_MS = 15 * DAY_MS;

/**
 * The user object exposed via `event.locals.user`. Cookies hold the plaintext
 * session token; the database holds the SHA-256 hash so a leaked database
 * dump cannot be replayed against the application.
 */
export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface SessionValidationResult {
  session: Session | null;
  user: SessionUser | null;
}

/**
 * Generate a fresh session token (cryptographically random, 20 bytes,
 * encoded as lowercase base32 without padding).
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Hash a token to derive its database id. Pure function so unit tests can
 * verify hashing consistency without a database.
 */
export function hashSessionToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(db: Db, token: string, userId: string): Promise<Session> {
  const id = hashSessionToken(token);
  const newSession: Session = {
    id,
    userId,
    expiresAt: Date.now() + SESSION_LIFETIME_MS
  };
  await db.insert(session).values(newSession);
  return newSession;
}

export async function validateSessionToken(
  db: Db,
  token: string
): Promise<SessionValidationResult> {
  const id = hashSessionToken(token);
  const row = await db
    .select({ session, user })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, id))
    .get();

  if (!row) {
    return { session: null, user: null };
  }

  if (Date.now() >= row.session.expiresAt) {
    await db.delete(session).where(eq(session.id, id));
    return { session: null, user: null };
  }

  // Sliding expiration: extend the session if it's getting close to expiry.
  if (Date.now() >= row.session.expiresAt - SESSION_REFRESH_THRESHOLD_MS) {
    const newExpiry = Date.now() + SESSION_LIFETIME_MS;
    await db.update(session).set({ expiresAt: newExpiry }).where(eq(session.id, id));
    row.session.expiresAt = newExpiry;
  }

  return {
    session: row.session,
    user: toSessionUser(row.user)
  };
}

export async function invalidateSession(db: Db, token: string): Promise<void> {
  const id = hashSessionToken(token);
  await db.delete(session).where(eq(session.id, id));
}

export async function invalidateAllUserSessions(db: Db, userId: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, userId));
}

function toSessionUser(row: User): SessionUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl
  };
}
