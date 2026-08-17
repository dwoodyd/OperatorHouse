ALTER TABLE `pipeline_deals`
  ADD COLUMN `closeOutcome` enum('won','lost'),
  ADD COLUMN `closeReason` varchar(100),
  ADD COLUMN `closedAt` timestamp;
--> statement-breakpoint
ALTER TABLE `vault_items`
  ADD COLUMN `sourceStrategyId` int;
--> statement-breakpoint
CREATE UNIQUE INDEX `vault_items_user_source_strategy_unique`
  ON `vault_items` (`userId`, `sourceStrategyId`);
