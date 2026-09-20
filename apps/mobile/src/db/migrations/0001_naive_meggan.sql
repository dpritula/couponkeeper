DROP INDEX `coupons_code_unique`;--> statement-breakpoint
CREATE INDEX `coupons_code_idx` ON `coupons` (`code`);