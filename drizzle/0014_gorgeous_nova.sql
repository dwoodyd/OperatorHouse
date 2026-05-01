CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`bookingId` int,
	`requestToken` varchar(128),
	`status` enum('pending','submitted','published','archived') NOT NULL DEFAULT 'pending',
	`rating` int,
	`headline` varchar(255),
	`body` text,
	`reviewerName` varchar(255),
	`reviewerEmail` varchar(320),
	`reviewerTitle` varchar(255),
	`isPublic` boolean NOT NULL DEFAULT false,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
