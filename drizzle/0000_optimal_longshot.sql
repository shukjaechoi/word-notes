CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`phonetic` text DEFAULT '' NOT NULL,
	`part_of_speech` text DEFAULT 'word' NOT NULL,
	`definition` text NOT NULL,
	`korean` text DEFAULT '' NOT NULL,
	`examples` text DEFAULT '[]' NOT NULL,
	`mastered` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `words_word_unique` ON `words` (`word`);