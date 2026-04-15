-- ============================================================
-- Smart Career Advisor - PL/SQL Stored Procedures & Functions
-- Database: skill_career_analytics (MySQL)
-- Author:   Smart Career Advisor Team
-- Created:  2026-03-28
-- ============================================================
-- The MySQL analytics database bridges MongoDB (primary store)
-- and provides aggregated reporting, login auditing, and
-- engagement scoring through stored routines & triggers.
-- ============================================================

USE skill_career_analytics;

-- ============================================================
-- Drop existing routines (safe re-run)
-- ============================================================
DROP PROCEDURE IF EXISTS sp_InsertLoginHistory;
DROP PROCEDURE IF EXISTS sp_GetUserLoginHistory;
DROP PROCEDURE IF EXISTS sp_UpdateAssessmentAnalytics;
DROP PROCEDURE IF EXISTS sp_DeleteOldLoginHistory;
DROP PROCEDURE IF EXISTS sp_GetTopSkills;
DROP PROCEDURE IF EXISTS sp_UpsertUserActivitySummary;
DROP PROCEDURE IF EXISTS sp_GetDashboardSummary;
DROP PROCEDURE IF EXISTS sp_GetAssessmentLeaderboard;

DROP FUNCTION IF EXISTS fn_GetUserEngagementScore;
DROP FUNCTION IF EXISTS fn_GetPassRate;
DROP FUNCTION IF EXISTS fn_GetAvgScoreBySkill;
DROP FUNCTION IF EXISTS fn_GetUserTotalLogins;

DROP TRIGGER IF EXISTS trg_AfterLoginInsert;
DROP TRIGGER IF EXISTS trg_AfterAssessmentAnalyticsUpdate;

DELIMITER $$

-- ============================================================
-- ██████╗  ██╗      ███████╗  ██████╗  ██╗     
-- ██╔══██╗ ██║      ██╔════╝ ██╔════╝  ██║     
-- ██████╔╝ ██║      ███████╗ ██║  ███╗ ██║     
-- ██╔═══╝  ██║      ╚════██║ ██║   ██║ ██║     
-- ██║      ███████╗ ███████║ ╚██████╔╝ ███████╗
-- STORED PROCEDURES
-- ============================================================

-- ============================================================
-- PROCEDURE: sp_InsertLoginHistory
-- Purpose  : CREATE - Record a new user login event
-- Params   : p_user_id    - MongoDB user _id (string)
--            p_username   - Display username
--            p_ip         - Client IP address
--            p_user_agent - Browser / client agent
--            p_success    - 1 = successful login, 0 = failed
--            p_reason     - Failure reason (NULL if success)
-- Usage    : CALL sp_InsertLoginHistory('uid123','john','1.2.3.4','Chrome',1,NULL);
-- ============================================================
CREATE PROCEDURE sp_InsertLoginHistory(
    IN p_user_id    VARCHAR(50),
    IN p_username   VARCHAR(100),
    IN p_ip         VARCHAR(45),
    IN p_user_agent VARCHAR(500),
    IN p_success    BOOLEAN,
    IN p_reason     VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

        INSERT INTO login_history (
            user_id, username, login_time,
            ip_address, user_agent, success, failure_reason
        ) VALUES (
            p_user_id, p_username, NOW(),
            p_ip, p_user_agent, p_success, p_reason
        );

    COMMIT;

    SELECT 
        LAST_INSERT_ID()        AS inserted_id,
        p_user_id               AS user_id,
        p_username              AS username,
        NOW()                   AS login_time,
        p_success               AS success,
        'Login recorded'        AS message;
END$$


-- ============================================================
-- PROCEDURE: sp_GetUserLoginHistory
-- Purpose  : READ - Retrieve login history for a specific user
-- Params   : p_user_id  - MongoDB user _id
--            p_limit    - Max rows to return (default 20)
--            p_offset   - Pagination offset (default 0)
-- Usage    : CALL sp_GetUserLoginHistory('uid123', 10, 0);
-- ============================================================
CREATE PROCEDURE sp_GetUserLoginHistory(
    IN p_user_id VARCHAR(50),
    IN p_limit   INT,
    IN p_offset  INT
)
BEGIN
    -- default guards
    IF p_limit  IS NULL OR p_limit  <= 0 THEN SET p_limit  = 20; END IF;
    IF p_offset IS NULL OR p_offset <  0 THEN SET p_offset = 0;  END IF;

    SELECT
        id,
        user_id,
        username,
        login_time,
        ip_address,
        user_agent,
        success,
        failure_reason,
        CASE WHEN success = 1 THEN 'Successful' ELSE 'Failed' END AS status_label
    FROM login_history
    WHERE user_id = p_user_id
    ORDER BY login_time DESC
    LIMIT p_limit OFFSET p_offset;

    -- Also return total count for pagination
    SELECT COUNT(*) AS total_records
    FROM login_history
    WHERE user_id = p_user_id;
END$$


-- ============================================================
-- PROCEDURE: sp_UpdateAssessmentAnalytics
-- Purpose  : UPDATE - Recalculate aggregated stats for one
--            assessment after a new attempt is recorded
-- Params   : p_assessment_id    - MongoDB assessment _id
--            p_assessment_title - Display title
--            p_skill_name       - Skill name
--            p_difficulty       - beginner / intermediate / advanced
--            p_new_score        - Score 0–100 from latest attempt
--            p_time_seconds     - Seconds taken for latest attempt
--            p_passed           - 1 if score >= 60, else 0
-- Usage    : CALL sp_UpdateAssessmentAnalytics('aid1','Python','Programming','beginner',80,240,1);
-- ============================================================
CREATE PROCEDURE sp_UpdateAssessmentAnalytics(
    IN p_assessment_id    VARCHAR(50),
    IN p_assessment_title VARCHAR(200),
    IN p_skill_name       VARCHAR(100),
    IN p_difficulty       VARCHAR(20),
    IN p_new_score        DECIMAL(5,2),
    IN p_time_seconds     INT,
    IN p_passed           BOOLEAN
)
BEGIN
    DECLARE v_exists       INT DEFAULT 0;
    DECLARE v_total        INT DEFAULT 0;
    DECLARE v_completions  INT DEFAULT 0;
    DECLARE v_old_avg      DECIMAL(5,2) DEFAULT 0;
    DECLARE v_old_time     INT DEFAULT 0;
    DECLARE v_old_passes   DECIMAL(5,2) DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM assessment_analytics
    WHERE assessment_id = p_assessment_id;

    IF v_exists = 0 THEN
        -- First attempt — INSERT
        INSERT INTO assessment_analytics (
            assessment_id, assessment_title, skill_name, difficulty,
            total_attempts, total_completions,
            avg_score, highest_score, lowest_score,
            pass_rate, avg_time_seconds
        ) VALUES (
            p_assessment_id, p_assessment_title, p_skill_name, p_difficulty,
            1, IF(p_passed, 1, 0),
            p_new_score, p_new_score, p_new_score,
            IF(p_passed, 100.00, 0.00), p_time_seconds
        );
    ELSE
        -- Subsequent attempt — UPDATE with rolling averages
        SELECT total_attempts, total_completions, avg_score, avg_time_seconds, pass_rate
        INTO   v_total, v_completions, v_old_avg, v_old_time, v_old_passes
        FROM   assessment_analytics
        WHERE  assessment_id = p_assessment_id;

        UPDATE assessment_analytics
        SET
            total_attempts    = v_total + 1,
            total_completions = v_completions + IF(p_passed, 1, 0),
            -- incremental average formula: avg_new = (avg_old * n + new_val) / (n+1)
            avg_score         = ROUND((v_old_avg * v_total + p_new_score) / (v_total + 1), 2),
            avg_time_seconds  = ROUND((v_old_time * v_total + p_time_seconds) / (v_total + 1), 0),
            highest_score     = GREATEST(highest_score, p_new_score),
            lowest_score      = LEAST(lowest_score, p_new_score),
            pass_rate         = ROUND(
                                    ((v_old_passes / 100) * v_total + IF(p_passed, 1, 0))
                                    / (v_total + 1) * 100, 2
                                ),
            last_updated      = NOW()
        WHERE assessment_id = p_assessment_id;
    END IF;

    -- Return updated record
    SELECT * FROM assessment_analytics WHERE assessment_id = p_assessment_id;
END$$


-- ============================================================
-- PROCEDURE: sp_DeleteOldLoginHistory
-- Purpose  : DELETE - Remove login records older than N days
-- Params   : p_days_old - Purge records older than this many days
-- Usage    : CALL sp_DeleteOldLoginHistory(90);
-- ============================================================
CREATE PROCEDURE sp_DeleteOldLoginHistory(
    IN p_days_old INT
)
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;

    IF p_days_old IS NULL OR p_days_old <= 0 THEN
        SET p_days_old = 90;   -- default: keep 90 days
    END IF;

    DELETE FROM login_history
    WHERE login_time < DATE_SUB(NOW(), INTERVAL p_days_old DAY);

    SET v_deleted_count = ROW_COUNT();

    SELECT
        v_deleted_count                           AS deleted_rows,
        DATE_SUB(NOW(), INTERVAL p_days_old DAY) AS cutoff_date,
        NOW()                                     AS executed_at,
        CONCAT('Purged records older than ', p_days_old, ' days') AS message;
END$$


-- ============================================================
-- PROCEDURE: sp_GetTopSkills
-- Purpose  : READ - Return top N skills ordered by popularity
-- Params   : p_limit    - Number of top skills to return
--            p_category - Filter by category (NULL = all)
-- Usage    : CALL sp_GetTopSkills(10, NULL);
--            CALL sp_GetTopSkills(5, 'Programming');
-- ============================================================
CREATE PROCEDURE sp_GetTopSkills(
    IN p_limit    INT,
    IN p_category VARCHAR(50)
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN SET p_limit = 10; END IF;

    IF p_category IS NULL OR p_category = '' THEN
        SELECT
            skill_id,
            skill_name,
            category,
            total_assessments,
            unique_users,
            ROUND(avg_proficiency, 2)   AS avg_proficiency,
            trend,
            last_assessed
        FROM skill_popularity
        ORDER BY total_assessments DESC, unique_users DESC
        LIMIT p_limit;
    ELSE
        SELECT
            skill_id,
            skill_name,
            category,
            total_assessments,
            unique_users,
            ROUND(avg_proficiency, 2)   AS avg_proficiency,
            trend,
            last_assessed
        FROM skill_popularity
        WHERE category = p_category
        ORDER BY total_assessments DESC, unique_users DESC
        LIMIT p_limit;
    END IF;
END$$


-- ============================================================
-- PROCEDURE: sp_UpsertUserActivitySummary
-- Purpose  : INSERT or UPDATE user engagement metrics
-- Params   : p_user_id         - MongoDB user _id
--            p_logins_delta    - Additional logins to add
--            p_assessments_delta - Additional assessments to add
--            p_new_score       - Latest assessment score (NULL to skip)
--            p_account_created - Account creation date
-- Usage    : CALL sp_UpsertUserActivitySummary('uid1', 1, 0, NULL, '2026-01-01');
-- ============================================================
CREATE PROCEDURE sp_UpsertUserActivitySummary(
    IN p_user_id          VARCHAR(50),
    IN p_logins_delta     INT,
    IN p_assessments_delta INT,
    IN p_new_score        DECIMAL(5,2),
    IN p_account_created  DATE
)
BEGIN
    DECLARE v_exists            INT DEFAULT 0;
    DECLARE v_total_assessments INT DEFAULT 0;
    DECLARE v_old_avg           DECIMAL(5,2) DEFAULT 0;
    DECLARE v_new_avg           DECIMAL(5,2) DEFAULT 0;
    DECLARE v_engagement        INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM user_activity_summary WHERE user_id = p_user_id;

    IF v_exists = 0 THEN
        -- New user record
        INSERT INTO user_activity_summary (
            user_id, total_logins, total_assessments,
            avg_assessment_score, last_login, last_assessment,
            account_created, engagement_score
        ) VALUES (
            p_user_id,
            IFNULL(p_logins_delta, 0),
            IFNULL(p_assessments_delta, 0),
            IFNULL(p_new_score, 0.00),
            IF(p_logins_delta > 0, NOW(), NULL),
            IF(p_assessments_delta > 0, NOW(), NULL),
            IFNULL(p_account_created, CURDATE()),
            0
        );
    ELSE
        -- Existing user — rolling avg score update
        IF p_new_score IS NOT NULL AND p_assessments_delta > 0 THEN
            SELECT total_assessments, avg_assessment_score
            INTO   v_total_assessments, v_old_avg
            FROM   user_activity_summary
            WHERE  user_id = p_user_id;

            SET v_new_avg = ROUND(
                (v_old_avg * v_total_assessments + p_new_score)
                / (v_total_assessments + p_assessments_delta), 2
            );
        END IF;

        UPDATE user_activity_summary
        SET
            total_logins      = total_logins + IFNULL(p_logins_delta, 0),
            total_assessments = total_assessments + IFNULL(p_assessments_delta, 0),
            avg_assessment_score = IF(p_new_score IS NOT NULL, v_new_avg, avg_assessment_score),
            last_login        = IF(p_logins_delta > 0, NOW(), last_login),
            last_assessment   = IF(p_assessments_delta > 0, NOW(), last_assessment),
            updated_at        = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Recalculate engagement score using function
    SET v_engagement = fn_GetUserEngagementScore(p_user_id);
    UPDATE user_activity_summary
    SET engagement_score = v_engagement
    WHERE user_id = p_user_id;

    SELECT * FROM user_activity_summary WHERE user_id = p_user_id;
END$$


-- ============================================================
-- PROCEDURE: sp_GetDashboardSummary
-- Purpose  : READ - Full platform summary for admin dashboard
-- Params   : p_days - Look-back window in days (default 30)
-- Usage    : CALL sp_GetDashboardSummary(30);
-- ============================================================
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_days INT
)
BEGIN
    IF p_days IS NULL OR p_days <= 0 THEN SET p_days = 30; END IF;

    -- Overall platform stats
    SELECT
        SUM(total_users)           AS total_users,
        SUM(new_users)             AS new_users_period,
        SUM(active_users)          AS active_users_period,
        SUM(assessments_taken)     AS assessments_taken,
        SUM(assessments_completed) AS assessments_completed,
        ROUND(AVG(avg_daily_score), 2) AS avg_platform_score,
        MIN(stat_date)             AS period_start,
        MAX(stat_date)             AS period_end
    FROM platform_stats
    WHERE stat_date >= DATE_SUB(CURDATE(), INTERVAL p_days DAY);

    -- Top 5 skills
    SELECT skill_name, category, total_assessments, avg_proficiency, trend
    FROM skill_popularity
    ORDER BY total_assessments DESC
    LIMIT 5;

    -- Recent login count (last 7 days)
    SELECT
        DATE(login_time)  AS login_date,
        COUNT(*)          AS total_logins,
        SUM(success)      AS successful,
        SUM(1 - success)  AS failed
    FROM login_history
    WHERE login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(login_time)
    ORDER BY login_date DESC;
END$$


-- ============================================================
-- PROCEDURE: sp_GetAssessmentLeaderboard
-- Purpose  : READ - Top scorers for a given assessment
-- Params   : p_assessment_id - MongoDB assessment _id
--            p_top_n         - How many top entries to return
-- Usage    : CALL sp_GetAssessmentLeaderboard('aid123', 10);
-- ============================================================
CREATE PROCEDURE sp_GetAssessmentLeaderboard(
    IN p_assessment_id VARCHAR(50),
    IN p_top_n         INT
)
BEGIN
    IF p_top_n IS NULL OR p_top_n <= 0 THEN SET p_top_n = 10; END IF;

    SELECT
        aa.assessment_title,
        aa.skill_name,
        aa.difficulty,
        aa.total_attempts,
        aa.total_completions,
        aa.avg_score,
        aa.highest_score,
        aa.lowest_score,
        aa.pass_rate,
        ROUND(aa.avg_time_seconds / 60, 1)  AS avg_time_minutes,
        aa.last_updated
    FROM assessment_analytics aa
    WHERE aa.assessment_id = p_assessment_id;

    -- Users with highest engagement related to this skill
    SELECT
        uas.user_id,
        uas.total_assessments,
        uas.avg_assessment_score,
        uas.engagement_score
    FROM user_activity_summary uas
    ORDER BY uas.avg_assessment_score DESC, uas.engagement_score DESC
    LIMIT p_top_n;
END$$


-- ============================================================
-- ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
-- STORED FUNCTIONS
-- ============================================================

-- ============================================================
-- FUNCTION: fn_GetUserEngagementScore
-- Purpose : Calculate a user's engagement score (0–100)
--           based on login frequency, assessments taken, and avg score
-- Params  : p_user_id - MongoDB user _id
-- Returns : INT - Score between 0 and 100
-- Usage   : SELECT fn_GetUserEngagementScore('uid123');
-- ============================================================
CREATE FUNCTION fn_GetUserEngagementScore(
    p_user_id VARCHAR(50)
)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_logins      INT     DEFAULT 0;
    DECLARE v_assessments INT     DEFAULT 0;
    DECLARE v_avg_score   DECIMAL(5,2) DEFAULT 0;
    DECLARE v_score       INT     DEFAULT 0;
    DECLARE v_login_pts   INT     DEFAULT 0;
    DECLARE v_assess_pts  INT     DEFAULT 0;
    DECLARE v_perf_pts    INT     DEFAULT 0;

    SELECT total_logins, total_assessments, avg_assessment_score
    INTO   v_logins, v_assessments, v_avg_score
    FROM   user_activity_summary
    WHERE  user_id = p_user_id;

    IF v_logins IS NULL THEN
        RETURN 0;
    END IF;

    -- Login points: up to 30 pts (cap at 15 logins)
    SET v_login_pts  = LEAST(v_logins * 2, 30);

    -- Assessment points: up to 40 pts (cap at 20 assessments)
    SET v_assess_pts = LEAST(v_assessments * 2, 40);

    -- Performance points: up to 30 pts based on avg score
    SET v_perf_pts   = ROUND(v_avg_score * 0.30);

    SET v_score = v_login_pts + v_assess_pts + v_perf_pts;

    RETURN LEAST(v_score, 100);
END$$


-- ============================================================
-- FUNCTION: fn_GetPassRate
-- Purpose : Return the current pass rate % for an assessment
-- Params  : p_assessment_id - MongoDB assessment _id
-- Returns : DECIMAL(5,2) - pass rate 0.00–100.00
-- Usage   : SELECT fn_GetPassRate('aid123');
-- ============================================================
CREATE FUNCTION fn_GetPassRate(
    p_assessment_id VARCHAR(50)
)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_pass_rate DECIMAL(5,2) DEFAULT 0.00;

    SELECT pass_rate INTO v_pass_rate
    FROM   assessment_analytics
    WHERE  assessment_id = p_assessment_id;

    RETURN IFNULL(v_pass_rate, 0.00);
END$$


-- ============================================================
-- FUNCTION: fn_GetAvgScoreBySkill
-- Purpose : Return the platform-wide average score for a skill
-- Params  : p_skill_name - Skill name (e.g. 'Python')
-- Returns : DECIMAL(5,2) - Average score 0.00–100.00
-- Usage   : SELECT fn_GetAvgScoreBySkill('Python');
-- ============================================================
CREATE FUNCTION fn_GetAvgScoreBySkill(
    p_skill_name VARCHAR(100)
)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_avg DECIMAL(5,2) DEFAULT 0.00;

    SELECT ROUND(AVG(avg_score), 2) INTO v_avg
    FROM   assessment_analytics
    WHERE  skill_name = p_skill_name;

    RETURN IFNULL(v_avg, 0.00);
END$$


-- ============================================================
-- FUNCTION: fn_GetUserTotalLogins
-- Purpose : Return total number of successful logins for a user
-- Params  : p_user_id - MongoDB user _id
-- Returns : INT - total successful login count
-- Usage   : SELECT fn_GetUserTotalLogins('uid123');
-- ============================================================
CREATE FUNCTION fn_GetUserTotalLogins(
    p_user_id VARCHAR(50)
)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count
    FROM   login_history
    WHERE  user_id  = p_user_id
      AND  success  = 1;

    RETURN v_count;
END$$


-- ============================================================
-- ████████╗██████╗ ██╗ ██████╗  ██████╗ ███████╗██████╗ ███████╗
-- TRIGGERS
-- ============================================================

-- ============================================================
-- TRIGGER: trg_AfterLoginInsert
-- Purpose : After every new login record is inserted,
--           automatically update user_activity_summary
--           so login counts stay in sync without extra calls
-- ============================================================
CREATE TRIGGER trg_AfterLoginInsert
AFTER INSERT ON login_history
FOR EACH ROW
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM user_activity_summary
    WHERE user_id = NEW.user_id;

    IF v_exists = 0 THEN
        -- Create summary row for new user
        INSERT INTO user_activity_summary (
            user_id, total_logins, total_assessments,
            avg_assessment_score, last_login,
            account_created, engagement_score
        ) VALUES (
            NEW.user_id,
            IF(NEW.success = 1, 1, 0),
            0, 0.00,
            IF(NEW.success = 1, NEW.login_time, NULL),
            DATE(NEW.login_time),
            0
        );
    ELSE
        UPDATE user_activity_summary
        SET
            total_logins = total_logins + IF(NEW.success = 1, 1, 0),
            last_login   = IF(NEW.success = 1, NEW.login_time, last_login),
            updated_at   = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
END$$


-- ============================================================
-- TRIGGER: trg_AfterAssessmentAnalyticsUpdate
-- Purpose : After assessment_analytics is updated, recalculate
--           skill trend (up / stable / down) in skill_popularity
-- ============================================================
CREATE TRIGGER trg_AfterAssessmentAnalyticsUpdate
AFTER UPDATE ON assessment_analytics
FOR EACH ROW
BEGIN
    DECLARE v_trend VARCHAR(20) DEFAULT 'stable';

    -- Simple trend determination based on pass_rate change
    IF NEW.pass_rate > OLD.pass_rate + 5 THEN
        SET v_trend = 'up';
    ELSEIF NEW.pass_rate < OLD.pass_rate - 5 THEN
        SET v_trend = 'down';
    ELSE
        SET v_trend = 'stable';
    END IF;

    UPDATE skill_popularity
    SET
        total_assessments = total_assessments + 1,
        avg_proficiency   = fn_GetAvgScoreBySkill(NEW.skill_name),
        trend             = v_trend,
        last_assessed     = NOW(),
        updated_at        = NOW()
    WHERE skill_name = NEW.skill_name;
END$$


DELIMITER ;

-- ============================================================
-- Quick verification — list all created routines
-- ============================================================
SELECT
    ROUTINE_TYPE  AS type,
    ROUTINE_NAME  AS name,
    CREATED       AS created_at
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'skill_career_analytics'
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;

SELECT
    TRIGGER_NAME  AS trigger_name,
    EVENT_OBJECT_TABLE AS on_table,
    ACTION_TIMING AS timing,
    EVENT_MANIPULATION AS event
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'skill_career_analytics';

-- ============================================================
-- QUICK DEMO / USAGE EXAMPLES
-- ============================================================
-- CALL sp_InsertLoginHistory('user001', 'john_doe', '192.168.1.1', 'Chrome 120', 1, NULL);
-- CALL sp_GetUserLoginHistory('user001', 10, 0);
-- CALL sp_UpdateAssessmentAnalytics('assess001','Python Fundamentals','Python','beginner', 85.00, 240, 1);
-- CALL sp_DeleteOldLoginHistory(90);
-- CALL sp_GetTopSkills(5, NULL);
-- CALL sp_UpsertUserActivitySummary('user001', 1, 1, 85.00, '2026-01-01');
-- CALL sp_GetDashboardSummary(30);
-- CALL sp_GetAssessmentLeaderboard('assess001', 10);
-- SELECT fn_GetUserEngagementScore('user001');
-- SELECT fn_GetPassRate('assess001');
-- SELECT fn_GetAvgScoreBySkill('Python');
-- SELECT fn_GetUserTotalLogins('user001');
