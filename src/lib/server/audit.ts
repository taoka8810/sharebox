import type { Db } from './db/client';
import { loginAudit } from './db/schema';

export type LoginAuditResult =
  | 'success'
  | 'denied_whitelist'
  | 'denied_oauth_failed'
  | 'denied_invalid_state';

export interface RecordLoginAttemptInput {
  email: string | null;
  result: LoginAuditResult;
  clientIp: string | null;
  userAgent: string | null;
}

export async function recordLoginAttempt(
  db: Db,
  input: RecordLoginAttemptInput
): Promise<void> {
  await db.insert(loginAudit).values({
    attemptedAt: Date.now(),
    email: input.email,
    result: input.result,
    clientIp: input.clientIp,
    userAgent: input.userAgent
  });
}
