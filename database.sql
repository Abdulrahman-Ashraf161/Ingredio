-- ============================================================
-- Ingredio — Database Schema
-- Purpose: Backend storage for a Smart Kitchen SPA
-- Requirements: MySQL, PDO Compatibility, Referential Integrity
-- ============================================================

-- 1. DATABASE INITIALIZATION
-- Using utf8mb4 for full character support
CREATE DATABASE IF NOT EXISTS `ingredio` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ingredio`;

-- 2. USERS TABLE
-- Stores credentials and daily nutritional targets for fitness tracking
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    
    -- The user's full display name (e.g., for the header greeting)
    `name` VARCHAR(100) NOT NULL,

    -- The user's unique login identifier
    -- Constraint: Must be unique, not null, and at least 3 characters
    `username` VARCHAR(50) NOT NULL UNIQUE,
    
    -- Primary contact and secondary login method
    `email` VARCHAR(200) NOT NULL UNIQUE,
    
    -- Secure hashed password (compatible with PHP password_hash)
    `password_hash` VARCHAR(255) NOT NULL,
    
    -- Avatar picture - allows user to upload custom avatar image
    `avatar_path` VARCHAR(255) DEFAULT NULL,

    -- Personalized fitness and gym goals
    `calorie_goal` INT DEFAULT 2000,
    `protein_goal` INT DEFAULT 150,
    `carbs_goal` INT DEFAULT 250,
    `fat_goal` INT DEFAULT 65,

    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Professional Constraints
    -- Ensures username and goals meet minimum quality standards
    CONSTRAINT `chk_name_length` CHECK (CHAR_LENGTH(`name`) >= 3),
    CONSTRAINT `chk_username_length` CHECK (CHAR_LENGTH(`username`) >= 3),
    CONSTRAINT `chk_user_goals` CHECK (`calorie_goal` >= 0 AND `protein_goal` >= 0)
) ENGINE=InnoDB;

-- 3. INGREDIENTS TABLE (Pantry Inventory)
-- Facilitates CRUD: Create, Read, Update, and Delete operations 
CREATE TABLE `ingredients` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(20) NOT NULL, -- e.g., grams, kg, ml, pieces
    `category` ENUM('produce', 'dairy', 'protein', 'grains', 'spices', 'beverages', 'other') DEFAULT 'other',
    `expiry_date` DATE DEFAULT NULL,
    `notes` VARCHAR(200) DEFAULT '',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Foreign Key: Cascades on user deletion to maintain data integrity
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    -- Performance Indexes for AJAX-based filtering and sorting
    INDEX `idx_user_ingredient` (`user_id`, `name`),
    INDEX `idx_expiry` (`expiry_date`)
) ENGINE=InnoDB;

-- 4. COOKING LOG TABLE
-- Stores meal history and handles the "File/Media Upload" requirement [cite: 55-58]
CREATE TABLE `cooking_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `meal_name` VARCHAR(100) NOT NULL,
    `image_path` VARCHAR(255) NOT NULL, -- Stores relative path on the server [cite: 57]
    `calories` INT DEFAULT 0,
    `protein` INT DEFAULT 0,
    `carbs` INT DEFAULT 0,
    `fat` INT DEFAULT 0,
    `notes` TEXT,
    `logged_date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Foreign Key
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_log` (`user_id`, `logged_date`)
) ENGINE=InnoDB;

-- 5. SAVED RECIPES TABLE (Optional Extension)
-- Persists third-party API results based on user preferences
CREATE TABLE `saved_recipes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `api_id` INT NOT NULL, -- External ID from Spoonacular/MealDB API
    `title` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(255),
    `Description` VARCHAR(200) NOT NULL,
    `Ingredients` VARCHAR(200) NOT NULL,
    `instructions` VARCHAR(200) NOT NULL,
    `calories` INT DEFAULT 0,
    `protein` INT DEFAULT 0,
    `carbs` INT DEFAULT 0,
    `fat` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    -- Constraint: Prevents a user from saving the same recipe multiple times
    UNIQUE KEY `unique_user_recipe` (`user_id`, `api_id`)
) ENGINE=InnoDB;