CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`dealId` int,
	`activityType` varchar(64) NOT NULL,
	`summary` varchar(500),
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `briefings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`briefingType` enum('login','daily','weekly','session') NOT NULL DEFAULT 'login',
	`content` text,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `briefings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`website` varchar(500),
	`linkedinUrl` varchar(500),
	`email` varchar(320),
	`industry` varchar(100),
	`summary` text,
	`status` enum('active','inactive','prospect') NOT NULL DEFAULT 'prospect',
	`lastContactAt` timestamp,
	`nextStep` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`sourceType` enum('linkedin','email','url','twitter','reddit','manual') NOT NULL DEFAULT 'manual',
	`sourceValue` varchar(1000),
	`rawInput` text,
	`analysisJson` json,
	`intentScore` float,
	`status` enum('new','review','analysis','ready','sent','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`title` varchar(255) NOT NULL,
	`stage` enum('Discovery','Analysis','Strategy','Proposal','Closed') NOT NULL DEFAULT 'Discovery',
	`value` float DEFAULT 0,
	`intentScore` float,
	`tags` json DEFAULT ('[]'),
	`notes` text,
	`closeProbability` float,
	`expectedCloseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipeline_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`outputType` enum('full','quick','deck','email') NOT NULL DEFAULT 'full',
	`inputContext` json,
	`content` text,
	`structuredOutput` json,
	`promptVersion` varchar(32) DEFAULT 'v1',
	`modelName` varchar(64),
	`status` enum('generating','complete','failed') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`dealId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','done','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`timezone` varchar(64) DEFAULT 'America/New_York',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `vault_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`type` enum('framework','case_study','voice_note','template','research','note') NOT NULL DEFAULT 'note',
	`title` varchar(500) NOT NULL,
	`content` text,
	`textContent` text,
	`filePath` varchar(1000),
	`tags` json DEFAULT ('[]'),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vault_items_id` PRIMARY KEY(`id`)
);
