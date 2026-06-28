CREATE TABLE `linkedin_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetAudience` text,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`dailyLimit` int NOT NULL DEFAULT 15,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalAccepted` int NOT NULL DEFAULT 0,
	`totalReplied` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_sequence_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`stepType` enum('connection_request','message') NOT NULL DEFAULT 'message',
	`delayDays` int NOT NULL DEFAULT 0,
	`messageTemplate` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `linkedin_sequence_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100),
	`title` varchar(255),
	`company` varchar(255),
	`linkedinUrl` varchar(500),
	`linkedClientId` int,
	`linkedProspectingLeadId` int,
	`status` enum('pending','requested','accepted','messaged','replied','converted','withdrawn') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 0,
	`requestSentAt` timestamp,
	`acceptedAt` timestamp,
	`lastMessagedAt` timestamp,
	`nextFollowUpAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_message_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`stepId` int,
	`stepOrder` int NOT NULL,
	`messageText` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveryStatus` enum('sent','delivered','read','replied') NOT NULL DEFAULT 'sent',
	CONSTRAINT `linkedin_message_log_id` PRIMARY KEY(`id`)
);
