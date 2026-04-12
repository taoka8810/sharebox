import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// =============================================================================
// user
// =============================================================================
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

// =============================================================================
// session
// =============================================================================
export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull()
  },
  (table) => [index('session_user_id_idx').on(table.userId)]
);

// =============================================================================
// share_entry (kind discriminator for the 1:1 sub-tables)
// =============================================================================
export const shareEntry = sqliteTable(
  'share_entry',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['text', 'file', 'url'] }).notNull(),
    createdAt: integer('created_at').notNull()
  },
  (table) => [
    index('share_entry_user_created_idx').on(table.userId, table.createdAt),
    index('share_entry_user_kind_created_idx').on(table.userId, table.kind, table.createdAt),
    check('share_entry_kind_check', sql`${table.kind} IN ('text', 'file', 'url')`)
  ]
);

// =============================================================================
// text_post
// =============================================================================
export const textPost = sqliteTable('text_post', {
  entryId: text('entry_id')
    .primaryKey()
    .references(() => shareEntry.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  byteLength: integer('byte_length').notNull()
});

// =============================================================================
// file_post
// =============================================================================
export const filePost = sqliteTable(
  'file_post',
  {
    entryId: text('entry_id')
      .primaryKey()
      .references(() => shareEntry.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull().unique(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    category: text('category', { enum: ['image', 'video', 'other'] }).notNull()
  },
  (table) => [
    check('file_post_category_check', sql`${table.category} IN ('image', 'video', 'other')`)
  ]
);

// =============================================================================
// url_post
// =============================================================================
export const urlPost = sqliteTable(
  'url_post',
  {
    entryId: text('entry_id')
      .primaryKey()
      .references(() => shareEntry.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    domain: text('domain').notNull(),
    ogpStatus: text('ogp_status', { enum: ['pending', 'success', 'failed'] }).notNull(),
    ogpTitle: text('ogp_title'),
    ogpDescription: text('ogp_description'),
    ogpImageUrl: text('ogp_image_url'),
    ogpSiteName: text('ogp_site_name'),
    ogpFetchedAt: integer('ogp_fetched_at')
  },
  (table) => [
    check('url_post_status_check', sql`${table.ogpStatus} IN ('pending', 'success', 'failed')`)
  ]
);

// =============================================================================
// login_audit
// =============================================================================
export const loginAudit = sqliteTable(
  'login_audit',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    attemptedAt: integer('attempted_at').notNull(),
    email: text('email'),
    result: text('result', {
      enum: ['success', 'denied_whitelist', 'denied_oauth_failed', 'denied_invalid_state']
    }).notNull(),
    clientIp: text('client_ip'),
    userAgent: text('user_agent')
  },
  (table) => [
    check(
      'login_audit_result_check',
      sql`${table.result} IN ('success', 'denied_whitelist', 'denied_oauth_failed', 'denied_invalid_state')`
    )
  ]
);

// Convenience types for use across server-side code.
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type ShareEntry = typeof shareEntry.$inferSelect;
export type TextPost = typeof textPost.$inferSelect;
export type FilePost = typeof filePost.$inferSelect;
export type UrlPost = typeof urlPost.$inferSelect;
