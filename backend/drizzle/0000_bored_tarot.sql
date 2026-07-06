CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_code` text NOT NULL,
	`name` text NOT NULL,
	`department` text NOT NULL,
	`country` text NOT NULL,
	`currency_code` text NOT NULL,
	`salary_amount` real NOT NULL,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_code_unique` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE INDEX `idx_employees_department` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `idx_employees_country` ON `employees` (`country`);