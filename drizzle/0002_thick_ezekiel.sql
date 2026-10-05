CREATE TABLE `gullak_analytics_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at` text NOT NULL,
	`page` text NOT NULL,
	`traffic_class` text NOT NULL,
	`traffic_signal` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_gullak_analytics_visits_time` ON `gullak_analytics_visits` (`occurred_at`);--> statement-breakpoint
ALTER TABLE `gullak_analytics_events` ADD `page_load_id` text;--> statement-breakpoint
ALTER TABLE `gullak_analytics_events` ADD `traffic_class` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `gullak_analytics_events` ADD `traffic_signal` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_gullak_analytics_events_page_load` ON `gullak_analytics_events` (`page_load_id`);