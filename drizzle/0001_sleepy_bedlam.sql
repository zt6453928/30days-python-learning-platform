CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`rule` text NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` varchar(100) NOT NULL,
	`dayId` int NOT NULL,
	`level` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'easy',
	`source` enum('original','generated') NOT NULL DEFAULT 'original',
	`starterCode` text NOT NULL,
	`solutionCode` text NOT NULL,
	`hints` text NOT NULL,
	`tags` text NOT NULL,
	`estimatedTime` varchar(50),
	`publicTests` text NOT NULL,
	`hiddenTests` text NOT NULL,
	`points` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `days` (
	`id` int NOT NULL,
	`order` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`summary` text NOT NULL,
	`estimatedTime` varchar(50),
	`contentMarkdown` text NOT NULL,
	`contentParsed` text NOT NULL,
	`learningObjectives` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` varchar(100) NOT NULL,
	`dayId` int NOT NULL,
	`type` enum('multiple_choice','true_false','fill_blank') NOT NULL,
	`question` text NOT NULL,
	`options` text,
	`correctAnswer` varchar(500) NOT NULL,
	`explanation` text NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'easy',
	`points` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` varchar(100) NOT NULL,
	`code` text NOT NULL,
	`passed` boolean NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`runtimeMs` int NOT NULL DEFAULT 0,
	`testResults` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `userDayProgress` (
	`userId` int NOT NULL,
	`dayId` int NOT NULL,
	`learned` boolean NOT NULL DEFAULT false,
	`quizPassed` boolean NOT NULL DEFAULT false,
	`exercisesLevel1Passed` int NOT NULL DEFAULT 0,
	`exercisesLevel1Total` int NOT NULL DEFAULT 0,
	`exercisesLevel2Passed` int NOT NULL DEFAULT 0,
	`exercisesLevel2Total` int NOT NULL DEFAULT 0,
	`exercisesLevel3Passed` int NOT NULL DEFAULT 0,
	`exercisesLevel3Total` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `userStats` (
	`userId` int NOT NULL,
	`totalScore` int NOT NULL DEFAULT 0,
	`daysCompleted` int NOT NULL DEFAULT 0,
	`daysInProgress` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`totalStudyTimeMinutes` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStats_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;