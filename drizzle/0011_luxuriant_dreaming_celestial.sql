CREATE TABLE `content_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('tips','case_study','promotion','thought_leadership','custom') NOT NULL DEFAULT 'custom',
	`mediaUrls` json DEFAULT ('[]'),
	`hashtagSets` json DEFAULT ('[]'),
	`platformVariants` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('linkedin','twitter','instagram','facebook') NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountHandle` varchar(255),
	`accountId` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`followerCount` int DEFAULT 0,
	`isConnected` boolean NOT NULL DEFAULT false,
	`connectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int,
	`platform` enum('linkedin','twitter','instagram','facebook') NOT NULL,
	`content` text NOT NULL,
	`mediaUrls` json DEFAULT ('[]'),
	`hashtags` json DEFAULT ('[]'),
	`status` enum('draft','scheduled','published','failed','pending_approval') NOT NULL DEFAULT 'draft',
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'approved',
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`platformPostId` varchar(255),
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`aiPrompt` text,
	`metrics` json,
	`strategyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`platforms` json DEFAULT ('[]'),
	`topics` json DEFAULT ('[]'),
	`tone` enum('professional','casual','thought_leader','educational') NOT NULL DEFAULT 'professional',
	`postsPerWeek` int NOT NULL DEFAULT 5,
	`preferredTimes` json,
	`vaultContextIds` json DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT false,
	`lastGeneratedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_execution_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`nodeId` int,
	`actionType` varchar(100),
	`result` enum('success','failed','skipped','pending') NOT NULL DEFAULT 'pending',
	`details` json,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_execution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`status` enum('running','completed','failed','paused') NOT NULL DEFAULT 'running',
	`currentNodeId` int,
	`triggerData` json,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflow_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`nodeType` enum('trigger','action','condition','delay') NOT NULL,
	`actionType` varchar(100),
	`label` varchar(255),
	`config` json,
	`positionX` int NOT NULL DEFAULT 0,
	`positionY` int NOT NULL DEFAULT 0,
	`nextNodeId` int,
	`trueBranchNodeId` int,
	`falseBranchNodeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','paused','draft') NOT NULL DEFAULT 'draft',
	`triggerType` varchar(100) NOT NULL,
	`triggerConfig` json,
	`executionCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
