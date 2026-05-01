CREATE TABLE `call_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`reason` enum('new_lead','follow_up','stale_deal','scheduled') NOT NULL DEFAULT 'follow_up',
	`scheduledFor` timestamp,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`pipelineStage` enum('Discovery','Analysis','Strategy','Proposal','Closed','nurture') NOT NULL,
	`openingLines` text,
	`talkingPoints` json,
	`objectionHandlers` json,
	`closingLines` text,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(30),
	`direction` enum('outbound','inbound') NOT NULL DEFAULT 'outbound',
	`disposition` enum('connected','voicemail','no_answer','wrong_number','busy'),
	`durationSeconds` int,
	`notes` text,
	`scriptId` int,
	`followUpDate` timestamp,
	`recorded` boolean NOT NULL DEFAULT false,
	`recordingUrl` varchar(1000),
	`calledAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_health_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 50,
	`factors` json,
	`trend` enum('improving','stable','declining') NOT NULL DEFAULT 'stable',
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_health_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_outreach_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(30),
	`outreachStatus` enum('not_started','active','paused','completed') NOT NULL DEFAULT 'not_started',
	`healthScore` int DEFAULT 50,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_outreach_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_outreach_profiles_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
CREATE TABLE `client_timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('sms','call','email','voice_agent','pipeline_change','strategy_delivered','note') NOT NULL,
	`eventId` int,
	`summary` varchar(1000),
	`sentiment` enum('positive','neutral','negative'),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_timeline_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`stepId` int NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`resendId` varchar(255),
	`status` enum('queued','sent','delivered','opened','clicked','replied','bounced','failed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequence_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`status` enum('active','completed','paused','unsubscribed') NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`lastEmailSentAt` timestamp,
	CONSTRAINT `email_sequence_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequence_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`subjectTemplate` varchar(500) NOT NULL,
	`bodyTemplate` text NOT NULL,
	`sendTimePreference` enum('morning','afternoon','best_time') NOT NULL DEFAULT 'morning',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sequence_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('manual','pipeline_stage_change','deal_closed','deal_stale','scheduled') NOT NULL DEFAULT 'manual',
	`triggerConfig` json,
	`status` enum('active','paused','draft') NOT NULL DEFAULT 'draft',
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(30) NOT NULL,
	`optInStatus` enum('opted_in','opted_out','pending') NOT NULL DEFAULT 'pending',
	`optInDate` timestamp,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`body` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','read') NOT NULL DEFAULT 'queued',
	`twilioSid` varchar(64),
	`templateId` int,
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`category` enum('follow_up','reminder','check_in','celebration','re_engagement','referral','custom') NOT NULL DEFAULT 'custom',
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('operator','operator_pro') NOT NULL DEFAULT 'operator',
	`stripeSubscriptionId` varchar(255),
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `voice_agent_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`callerPhone` varchar(30),
	`durationSeconds` int,
	`transcript` text,
	`summary` text,
	`sentiment` enum('positive','neutral','negative'),
	`outcome` enum('resolved','transferred','callback_scheduled','voicemail'),
	`vapiCallId` varchar(255),
	`handledAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_agent_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_agent_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`vaultItemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_agent_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`voiceId` varchar(255),
	`personality` enum('professional','warm','concise','custom') NOT NULL DEFAULT 'professional',
	`greetingScript` text,
	`fallbackAction` enum('voicemail','transfer','schedule_callback') NOT NULL DEFAULT 'voicemail',
	`isActive` boolean NOT NULL DEFAULT false,
	`phoneNumber` varchar(30),
	`vapiAgentId` varchar(255),
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voice_agents_id` PRIMARY KEY(`id`)
);
