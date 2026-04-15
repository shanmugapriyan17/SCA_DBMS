-- ============================================
-- Smart Career Advisor - MySQL Schema
-- Analytics & Reporting Database
-- Created: 2026-01-29
-- ============================================

-- Create database (run this first if not exists)
-- CREATE DATABASE IF NOT EXISTS skill_career_analytics;
-- USE skill_career_analytics;

-- ============================================
-- TABLE: login_history
-- Purpose: Track user login activity for security & analytics
-- ============================================
CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL COMMENT 'MongoDB user _id reference',
    username VARCHAR(100) NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(255) NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: assessment_analytics  
-- Purpose: Aggregated assessment performance statistics
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL COMMENT 'MongoDB assessment _id reference',
    assessment_title VARCHAR(200) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'beginner',
    total_attempts INT DEFAULT 0,
    total_completions INT DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    highest_score DECIMAL(5,2) DEFAULT 0.00,
    lowest_score DECIMAL(5,2) DEFAULT 0.00,
    pass_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage of passing attempts',
    avg_time_seconds INT DEFAULT 0 COMMENT 'Average completion time',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_assessment_id (assessment_id),
    INDEX idx_skill_name (skill_name),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: platform_stats
-- Purpose: Daily platform usage statistics
-- ============================================
CREATE TABLE IF NOT EXISTS platform_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    active_users INT DEFAULT 0 COMMENT 'Users who logged in today',
    assessments_taken INT DEFAULT 0,
    assessments_completed INT DEFAULT 0,
    avg_daily_score DECIMAL(5,2) DEFAULT 0.00,
    total_skills_assessed INT DEFAULT 0,
    peak_hour TINYINT DEFAULT 0 COMMENT 'Hour with most activity (0-23)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stat_date (stat_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: skill_popularity
-- Purpose: Track which skills are most assessed
-- ============================================
CREATE TABLE IF NOT EXISTS skill_popularity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id VARCHAR(50) NOT NULL COMMENT 'MongoDB skill _id reference',
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_assessments INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    avg_proficiency DECIMAL(5,2) DEFAULT 0.00,
    trend VARCHAR(20) DEFAULT 'stable' COMMENT 'up, down, stable',
    last_assessed DATETIME NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_skill_id (skill_id),
    INDEX idx_category (category),
    INDEX idx_total_assessments (total_assessments DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: user_activity_summary
-- Purpose: Summarized user engagement metrics
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL COMMENT 'MongoDB user _id reference',
    total_logins INT DEFAULT 0,
    total_assessments INT DEFAULT 0,
    total_skills_learned INT DEFAULT 0,
    avg_assessment_score DECIMAL(5,2) DEFAULT 0.00,
    last_login DATETIME NULL,
    last_assessment DATETIME NULL,
    account_created DATE NOT NULL,
    engagement_score INT DEFAULT 0 COMMENT 'Calculated engagement metric 0-100',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_engagement (engagement_score DESC),
    INDEX idx_last_login (last_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
