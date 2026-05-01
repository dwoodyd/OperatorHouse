CREATE TABLE `bookingEmailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`type` enum('confirmation','reminder_24h','reminder_1h','cancellation','reschedule') NOT NULL,
	`sentTo` varchar(255) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	CONSTRAINT `bookingEmailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientPortals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int NOT NULL,
	`accessToken` varchar(128) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`allowInvoices` boolean NOT NULL DEFAULT true,
	`allowBooking` boolean NOT NULL DEFAULT true,
	`allowMessages` boolean NOT NULL DEFAULT true,
	`allowContracts` boolean NOT NULL DEFAULT false,
	`lastAccessedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientPortals_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientPortals_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `portalDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('invoice','contract','proposal','report','other') NOT NULL DEFAULT 'other',
	`fileUrl` text,
	`status` enum('pending','viewed','signed','approved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portalDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portalMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portalId` int NOT NULL,
	`senderType` enum('operator','client') NOT NULL,
	`content` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portalMessages_id` PRIMARY KEY(`id`)
);
