CREATE TABLE `ar_answers` (
	`member_id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`answers` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`role` text NOT NULL,
	`reflection` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `ar_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`code`) REFERENCES `ar_classrooms`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ar_answers_class_idx` ON `ar_answers` (`code`);--> statement-breakpoint
CREATE TABLE `ar_classrooms` (
	`code` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`phase` text DEFAULT 'making' NOT NULL,
	`graph_key` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ar_members` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`group_no` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`code`) REFERENCES `ar_classrooms`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ar_members_token_hash_unique` ON `ar_members` (`token_hash`);--> statement-breakpoint
CREATE INDEX `ar_members_class_idx` ON `ar_members` (`code`);--> statement-breakpoint
CREATE TABLE `ar_works` (
	`code` text NOT NULL,
	`group_no` integer NOT NULL,
	`heritage_id` integer NOT NULL,
	`version` integer NOT NULL,
	`object_key` text NOT NULL,
	`questions` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`code`, `group_no`),
	FOREIGN KEY (`code`) REFERENCES `ar_classrooms`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `ar_members`(`id`) ON UPDATE no action ON DELETE no action
);
