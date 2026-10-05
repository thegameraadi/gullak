CREATE TABLE `gullak_analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`occurred_at` text NOT NULL,
	`mode` text NOT NULL,
	`device` text NOT NULL,
	`os` text NOT NULL,
	`browser` text NOT NULL,
	`standalone` integer NOT NULL,
	`source` text NOT NULL,
	`engine` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_gullak_analytics_events_time` ON `gullak_analytics_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_gullak_analytics_events_visitor_time` ON `gullak_analytics_events` (`visitor_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `gullak_analytics_visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`first_seen` text NOT NULL,
	`last_seen` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gullak_manage_owner` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bound_at` text NOT NULL
);
