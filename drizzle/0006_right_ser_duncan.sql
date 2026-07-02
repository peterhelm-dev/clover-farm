CREATE TABLE `mealPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`meals` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mealPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waterIntake` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`amount` int NOT NULL,
	`goal` int NOT NULL DEFAULT 2000,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waterIntake_id` PRIMARY KEY(`id`)
);
