CREATE TABLE `shared_deliverables` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `strategyId` int NOT NULL,
  `clientId` int,
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `tokenHash` varchar(128) NOT NULL,
  `title` varchar(255) NOT NULL,
  `strategyContent` text NOT NULL,
  `clientName` varchar(255),
  `consultantName` varchar(255) NOT NULL,
  `consultantLogoUrl` varchar(1000),
  `accentColor` varchar(16) NOT NULL DEFAULT '#F5A623',
  `expiresAt` timestamp NULL,
  `revokedAt` timestamp NULL,
  `lastOpenedAt` timestamp NULL,
  `openCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `shared_deliverables_id` PRIMARY KEY(`id`),
  CONSTRAINT `shared_deliverables_tokenHash_unique` UNIQUE(`tokenHash`)
);

CREATE TABLE `shared_deliverable_sources` (
  `id` int AUTO_INCREMENT NOT NULL,
  `deliverableId` int NOT NULL,
  `vaultItemId` int,
  `sourceTitle` varchar(255) NOT NULL,
  `sourceExcerpt` text NOT NULL,
  `rationale` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `shared_deliverable_sources_id` PRIMARY KEY(`id`)
);
