CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteOnly` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`)
);
