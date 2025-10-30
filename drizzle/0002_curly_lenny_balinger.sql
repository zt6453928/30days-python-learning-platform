ALTER TABLE `challenges` ADD `referenceAnswer` text NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` ADD `answerExplanation` text NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` ADD `gradingCriteria` text NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `feedback` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `aiAnalysis` text;