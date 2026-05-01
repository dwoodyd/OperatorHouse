CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('draft','sent','viewed','signed','voided') NOT NULL DEFAULT 'draft',
	`signToken` varchar(128),
	`signerName` varchar(255),
	`signerEmail` varchar(320),
	`signedAt` timestamp,
	`signatureData` text,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`portalDocumentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
