-- Create table for panel users
DROP TABLE IF EXISTS `panel_users`;
CREATE TABLE `panel_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(128) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Administrator','Senior Moderator','Moderator') DEFAULT 'Moderator',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create First Panel User 'admin'. Password = admin1234
INSERT INTO `panel_users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1,	'admin',	'admin@gmail.com',	'$2a$12$fFeAimQCZc/k6/bOcB0VI.DV/Nui1bu8eXX7uFS1iuYKY/GIYNYYu',	'Administrator',	'2026-02-18 02:36:36',	'2026-02-22 06:15:37');

-- Create table for VIPs (table name is in sync with the Mesharky VIP Plugin)
DROP TABLE IF EXISTS `player_groups`;
CREATE TABLE `player_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `steamid64` bigint(20) NOT NULL,
  `group_name` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `expires` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_player_group` (`steamid64`,`group_name`),
  KEY `steamid64` (`steamid64`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for Server Admins (table name is in sync with the Simple Admin Plugin)
DROP TABLE IF EXISTS `sa_admins`;
CREATE TABLE `sa_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_name` varchar(128) DEFAULT NULL,
  `player_steamid` bigint(20) DEFAULT NULL,
  `flags` text DEFAULT NULL,
  `immunity` int(11) NOT NULL DEFAULT 0,
  `server_id` int(11) DEFAULT NULL,
  `ends` timestamp NULL DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `sa_admins_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `sa_groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create table for Bans (table name is in sync with the Simple Admin Plugin)
DROP TABLE IF EXISTS `sa_bans`;
CREATE TABLE `sa_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_name` varchar(128) DEFAULT NULL,
  `player_steamid` bigint(20) DEFAULT NULL,
  `player_ip` varchar(128) DEFAULT NULL,
  `admin_steamid` bigint(20) NOT NULL,
  `admin_name` varchar(128) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `duration` int(11) NOT NULL,
  `ends` timestamp NULL DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `server_id` int(11) DEFAULT NULL,
  `unban_id` int(11) DEFAULT NULL,
  `status` enum('ACTIVE','UNBANNED','EXPIRED','') NOT NULL DEFAULT 'ACTIVE',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `unban_id` (`unban_id`),
  CONSTRAINT `sa_bans_ibfk_1` FOREIGN KEY (`unban_id`) REFERENCES `sa_unbans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;