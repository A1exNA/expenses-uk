-- Создание базы данных (если не существует)
CREATE DATABASE IF NOT EXISTS `expenses_uk` CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `expenses_uk`;

-- Таблица objects (дома)
CREATE TABLE IF NOT EXISTS `objects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `object_address` VARCHAR(255) NOT NULL,
    `object_area` DECIMAL(10,2) NOT NULL,
    `management_fee` DECIMAL(10,2) NOT NULL,
    `current_repair_rate` DECIMAL(10,2) NOT NULL,
    `service_start_date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица users (сотрудники)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(50) NOT NULL,
    `user_post` VARCHAR(50) NOT NULL,
    `email` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица spending_groups (группы расходов)
CREATE TABLE IF NOT EXISTS `spending_groups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `object_id` INT NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица bills (счета)
CREATE TABLE IF NOT EXISTS `bills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `spending_group_id` INT NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    FOREIGN KEY (`spending_group_id`) REFERENCES `spending_groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица expense_bills (позиции счетов)
CREATE TABLE IF NOT EXISTS `expense_bills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bills_id` INT NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`bills_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица checks (чеки)
CREATE TABLE IF NOT EXISTS `checks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `spending_group_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    FOREIGN KEY (`spending_group_id`) REFERENCES `spending_groups`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица expense_checks (позиции чеков)
CREATE TABLE IF NOT EXISTS `expense_checks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `check_id` INT NOT NULL,
    `text` TEXT NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица deposits (выдача подотчётных)
CREATE TABLE IF NOT EXISTS `deposits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;