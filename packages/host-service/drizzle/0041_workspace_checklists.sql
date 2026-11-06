CREATE TABLE `workspace_checklists` (
	`workspace_id` text PRIMARY KEY NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
