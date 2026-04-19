CREATE TABLE `stripe_events` (
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripe_events_eventId` PRIMARY KEY(`eventId`)
);
