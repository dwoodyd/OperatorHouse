CREATE TABLE `crm_activity_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_activity_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(100),
	`size` enum('solo','small','medium','large','enterprise') NOT NULL DEFAULT 'small',
	`website` varchar(500),
	`description` text,
	`tags` json,
	`customFields` json,
	`totalPipelineValue` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_contact_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#6366f1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_contact_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL DEFAULT '',
	`email` varchar(320),
	`phone` varchar(30),
	`secondaryEmail` varchar(320),
	`companyId` int,
	`title` varchar(255),
	`lifecycleStage` enum('lead','prospect','client','past_client','partner') NOT NULL DEFAULT 'lead',
	`source` enum('manual','funnel','import','prospecting','referral','social') NOT NULL DEFAULT 'manual',
	`tags` json,
	`customFields` json,
	`avatarUrl` varchar(1000),
	`timezone` varchar(64),
	`optedInSms` boolean NOT NULL DEFAULT false,
	`optedInEmail` boolean NOT NULL DEFAULT true,
	`healthScore` int DEFAULT 50,
	`lastContactedAt` timestamp,
	`linkedClientId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_custom_field_defs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('contact','company') NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','dropdown','checkbox','url','long_text') NOT NULL,
	`options` json,
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_custom_field_defs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`filterRules` json NOT NULL,
	`contactCount` int DEFAULT 0,
	`isDynamic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_counters` (
	`userId` int NOT NULL,
	`lastNumber` int NOT NULL DEFAULT 0,
	CONSTRAINT `invoice_counters_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`contactId` int,
	`companyId` int,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`status` enum('draft','sent','viewed','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`lineItems` json NOT NULL,
	`subtotal` float NOT NULL DEFAULT 0,
	`taxRate` float NOT NULL DEFAULT 0,
	`taxAmount` float NOT NULL DEFAULT 0,
	`discountAmount` float NOT NULL DEFAULT 0,
	`total` float NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`paymentTerms` enum('due_on_receipt','net_15','net_30','net_60') NOT NULL DEFAULT 'net_30',
	`dueDate` timestamp,
	`paidAt` timestamp,
	`paymentMethod` varchar(50),
	`stripePaymentIntentId` varchar(255),
	`stripeInvoiceId` varchar(255),
	`stripePaymentLinkId` varchar(255),
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringInterval` enum('weekly','monthly','quarterly','yearly'),
	`recurringNextDate` timestamp,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`amount` float NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`method` enum('stripe','bank_transfer','cash','check','other') NOT NULL DEFAULT 'stripe',
	`stripePaymentIntentId` varchar(255),
	`notes` text,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_records_id` PRIMARY KEY(`id`)
);
