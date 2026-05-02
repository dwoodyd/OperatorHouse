CREATE TABLE `user_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newClient` tinyint NOT NULL DEFAULT 1,
	`dealMoved` tinyint NOT NULL DEFAULT 1,
	`payment` tinyint NOT NULL DEFAULT 1,
	`briefingReady` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_notification_preferences_userId_unique` UNIQUE(`userId`)
);
