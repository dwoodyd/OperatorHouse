CREATE TABLE `availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocked_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocked_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`meetingTypeId` int NOT NULL,
	`contactId` int,
	`bookedByName` varchar(255) NOT NULL,
	`bookedByEmail` varchar(320) NOT NULL,
	`bookedByPhone` varchar(50),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`status` enum('confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed',
	`intakeResponses` json,
	`calendarEventId` varchar(255),
	`confirmationSent` boolean NOT NULL DEFAULT false,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`notes` text,
	`cancelReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`pageOrder` int NOT NULL DEFAULT 0,
	`sections` json NOT NULL,
	`formConfig` json,
	`seoTitle` varchar(255),
	`seoDescription` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`views` int NOT NULL DEFAULT 0,
	`submissions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelPageId` int NOT NULL,
	`funnelId` int NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`formData` json NOT NULL,
	`sourceUrl` varchar(1000),
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`ipAddress` varchar(45),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`slug` varchar(100) NOT NULL,
	`templateType` varchar(50),
	`totalViews` int NOT NULL DEFAULT 0,
	`totalSubmissions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`durationMinutes` int NOT NULL DEFAULT 30,
	`color` varchar(20) NOT NULL DEFAULT '#f5c842',
	`bufferBeforeMinutes` int NOT NULL DEFAULT 0,
	`bufferAfterMinutes` int NOT NULL DEFAULT 0,
	`intakeQuestions` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`maxBookingsPerDay` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_types_id` PRIMARY KEY(`id`)
);
