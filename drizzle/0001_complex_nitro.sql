CREATE TABLE `foodLogs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rawSpeech` text,
	`foodName` varchar(255) NOT NULL,
	`quantity` varchar(255),
	`calories` decimal(8,2) DEFAULT '0',
	`protein` decimal(8,2) DEFAULT '0',
	`carbs` decimal(8,2) DEFAULT '0',
	`fat` decimal(8,2) DEFAULT '0',
	`fiber` decimal(8,2) DEFAULT '0',
	`allergensDetected` json DEFAULT ('[]'),
	`confidence` enum('high','medium','low') DEFAULT 'medium',
	`notes` text,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `foodLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`weightLbs` decimal(6,2),
	`allergies` json DEFAULT ('[]'),
	`dietaryChoices` json DEFAULT ('[]'),
	`healthConditions` json DEFAULT ('[]'),
	`calorieTarget` int DEFAULT 2000,
	`proteinTarget` int DEFAULT 120,
	`carbsTarget` int DEFAULT 200,
	`fatTarget` int DEFAULT 65,
	`fiberTarget` int DEFAULT 28,
	`onboardingComplete` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
