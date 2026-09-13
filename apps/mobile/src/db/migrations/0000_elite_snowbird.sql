CREATE TABLE `channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channels_key_unique` ON `channels` (`key`);--> statement-breakpoint
CREATE INDEX `channels_sort_order_idx` ON `channels` (`sort_order`);--> statement-breakpoint
CREATE TABLE `coupon_channels` (
	`coupon_id` integer NOT NULL,
	`channel_id` integer NOT NULL,
	PRIMARY KEY(`coupon_id`, `channel_id`),
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coupon_channels_channel_idx` ON `coupon_channels` (`channel_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`discount_type` text NOT NULL,
	`value` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`note` text,
	`days_left` integer,
	`status` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_status_idx` ON `coupons` (`status`);--> statement-breakpoint
CREATE INDEX `coupons_end_date_idx` ON `coupons` (`end_date`);--> statement-breakpoint
CREATE INDEX `coupons_discount_type_idx` ON `coupons` (`discount_type`);