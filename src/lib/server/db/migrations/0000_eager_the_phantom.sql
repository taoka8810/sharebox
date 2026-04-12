CREATE TABLE `file_post` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`category` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `share_entry`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "file_post_category_check" CHECK("file_post"."category" IN ('image', 'video', 'other'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `file_post_r2_key_unique` ON `file_post` (`r2_key`);--> statement-breakpoint
CREATE TABLE `login_audit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempted_at` integer NOT NULL,
	`email` text,
	`result` text NOT NULL,
	`client_ip` text,
	`user_agent` text,
	CONSTRAINT "login_audit_result_check" CHECK("login_audit"."result" IN ('success', 'denied_whitelist', 'denied_oauth_failed', 'denied_invalid_state'))
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `share_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "share_entry_kind_check" CHECK("share_entry"."kind" IN ('text', 'file', 'url'))
);
--> statement-breakpoint
CREATE INDEX `share_entry_user_created_idx` ON `share_entry` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `share_entry_user_kind_created_idx` ON `share_entry` (`user_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `text_post` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`byte_length` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `share_entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `url_post` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`domain` text NOT NULL,
	`ogp_status` text NOT NULL,
	`ogp_title` text,
	`ogp_description` text,
	`ogp_image_url` text,
	`ogp_site_name` text,
	`ogp_fetched_at` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `share_entry`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "url_post_status_check" CHECK("url_post"."ogp_status" IN ('pending', 'success', 'failed'))
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`google_sub` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_google_sub_unique` ON `user` (`google_sub`);