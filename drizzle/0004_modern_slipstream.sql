ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(50) DEFAULT 'inactive';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionId` varchar(255);