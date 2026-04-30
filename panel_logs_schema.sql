-- Panel Logs Table Schema
-- This table stores audit logs for panel user actions

CREATE TABLE IF NOT EXISTS panel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    panel_user_id INT NULL COMMENT 'Foreign key to panel_users (NULL if user deleted)',
    username VARCHAR(50) NOT NULL COMMENT 'Username at time of log creation (preserved even if user deleted)',
    ip_address VARCHAR(15) NOT NULL COMMENT 'IPv4 address',
    action_type VARCHAR(255) NOT NULL COMMENT 'Type of action performed (e.g., "User Created", "User Updated", "User Deleted", "Profile Updated")',
    details TEXT NOT NULL COMMENT 'Multi-line text with HTML formatting for bold text (e.g., "<b>edited value</b>")',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action occurred',
    
    -- Foreign key to panel_users table (SET NULL on delete to preserve logs)
    FOREIGN KEY (panel_user_id) REFERENCES panel_users(id) ON DELETE SET NULL,
    
    -- Index for faster lookups by user
    INDEX idx_panel_user_id (panel_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
