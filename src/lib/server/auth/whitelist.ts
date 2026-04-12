/**
 * Decide whether the given email address is allowed to log in.
 *
 * The check is intentionally case-insensitive (Google may return the same
 * address with mixed case) and trims surrounding whitespace, but it does not
 * implement any other normalisation (e.g. dot-folding) — sharebox is a
 * single-owner app and the owner is expected to use one canonical address.
 */
export function isAllowedEmail(email: string | null | undefined, ownerEmail: string): boolean {
  if (!email || !ownerEmail) return false;
  return email.trim().toLowerCase() === ownerEmail.trim().toLowerCase();
}
