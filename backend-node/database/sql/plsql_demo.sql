-- ================================================================
--   Smart Career Advisor — PL/SQL DEMO SCRIPT
--   Open this in MySQL Workbench and run each block one by one
--   Database: skill_career_analytics
-- ================================================================

USE skill_career_analytics;


-- ================================================================
-- STEP 1 — SHOW ALL PROCEDURES, FUNCTIONS, TRIGGERS (run this FIRST)
-- This proves to the professor everything is installed
-- ================================================================

-- List all Stored Procedures
SELECT ROUTINE_NAME AS 'Stored Procedure', ROUTINE_TYPE AS Type, CREATED
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'skill_career_analytics'
  AND  ROUTINE_TYPE   = 'PROCEDURE'
ORDER  BY ROUTINE_NAME;

-- List all Stored Functions
SELECT ROUTINE_NAME AS 'Stored Function', ROUTINE_TYPE AS Type, CREATED
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'skill_career_analytics'
  AND  ROUTINE_TYPE   = 'FUNCTION'
ORDER  BY ROUTINE_NAME;

-- List all Triggers
SELECT TRIGGER_NAME AS 'Trigger', EVENT_MANIPULATION AS Event,
       EVENT_OBJECT_TABLE AS 'On Table', ACTION_TIMING AS Timing
FROM   information_schema.TRIGGERS
WHERE  TRIGGER_SCHEMA = 'skill_career_analytics';


-- ================================================================
-- STEP 2 — STORED PROCEDURE: sp_InsertLoginHistory
-- PURPOSE: CREATE — Record a user login event
-- EXPLAIN: "When a user logs in to our app, this procedure
--           is called to securely record the login with IP,
--           browser info, and whether it succeeded or failed."
-- ================================================================

CALL sp_InsertLoginHistory(
    'user_demo_001',      -- user ID (from MongoDB)
    'john_doe',           -- username
    '192.168.1.100',      -- IP address
    'Chrome/120 Windows', -- browser
    1,                    -- 1 = success, 0 = failed
    NULL                  -- failure reason (NULL = no failure)
);

-- Verify the row was inserted
SELECT * FROM login_history WHERE user_id = 'user_demo_001';


-- ================================================================
-- STEP 3 — STORED PROCEDURE: sp_GetUserLoginHistory
-- PURPOSE: READ — Retrieve login history for a specific user
-- EXPLAIN: "This reads all login records for a user, paginated.
--           The professor can see the 2nd result set shows total count."
-- ================================================================

CALL sp_GetUserLoginHistory(
    'user_demo_001',  -- user ID
    10,               -- limit (show 10 records)
    0                 -- offset (start from beginning)
);


-- ================================================================
-- STEP 4 — STORED PROCEDURE: sp_UpdateAssessmentAnalytics
-- PURPOSE: UPDATE — Recalculate stats after a new attempt
-- EXPLAIN: "After a student completes a Python assessment scoring 85,
--           this procedure updates the rolling average, highest score,
--           pass rate etc. using incremental average formula:
--           avg_new = (avg_old × n + new_score) / (n + 1)"
-- ================================================================

CALL sp_UpdateAssessmentAnalytics(
    'py_assess_001',         -- assessment ID (from MongoDB)
    'Python Fundamentals',   -- assessment title
    'Python',                -- skill name
    'beginner',              -- difficulty level
    85.00,                   -- new score (0-100)
    210,                     -- time taken in seconds
    1                        -- 1 = passed (score >= 60)
);

-- Add a second attempt to show the rolling average updating
CALL sp_UpdateAssessmentAnalytics(
    'py_assess_001',
    'Python Fundamentals',
    'Python',
    'beginner',
    70.00,    -- different score
    300,
    1
);

-- Verify the stats updated correctly
SELECT * FROM assessment_analytics WHERE assessment_id = 'py_assess_001';


-- ================================================================
-- STEP 5 — STORED PROCEDURE: sp_GetTopSkills
-- PURPOSE: READ — Show most popular skills on the platform
-- EXPLAIN: "This ranks all skills by how many times they have
--           been assessed. Useful for platform analytics dashboard."
-- ================================================================

-- Get top 5 skills across all categories
CALL sp_GetTopSkills(5, NULL);

-- Get top skills in only 'Programming' category
CALL sp_GetTopSkills(5, 'Programming');


-- ================================================================
-- STEP 6 — STORED PROCEDURE: sp_UpsertUserActivitySummary
-- PURPOSE: CREATE / UPDATE — Smart insert-or-update user engagement
-- EXPLAIN: "This uses INSERT...ON DUPLICATE logic. If the user
--           has no record it creates one, otherwise it updates
--           login count, assessment count, and recalculates score."
-- ================================================================

-- First call = INSERT (creates the record)
CALL sp_UpsertUserActivitySummary(
    'user_demo_001',  -- user ID
    1,                -- logins to add
    1,                -- assessments completed
    85.00,            -- latest score
    '2026-01-15'      -- account creation date
);

-- Second call = UPDATE (updates existing record)
CALL sp_UpsertUserActivitySummary(
    'user_demo_001',
    1,      -- one more login
    1,      -- one more assessment
    90.00,  -- new score
    '2026-01-15'
);

-- See the result
SELECT * FROM user_activity_summary WHERE user_id = 'user_demo_001';


-- ================================================================
-- STEP 7 — STORED PROCEDURE: sp_GetDashboardSummary
-- PURPOSE: READ — Full admin dashboard data (3 result sets)
-- EXPLAIN: "This returns THREE result sets in one call:
--           1st = platform totals, 2nd = top 5 skills,
--           3rd = login trend for last 7 days."
-- ================================================================

CALL sp_GetDashboardSummary(30);  -- last 30 days


-- ================================================================
-- STEP 8 — STORED PROCEDURE: sp_GetAssessmentLeaderboard
-- PURPOSE: READ — Top performers for a given assessment
-- ================================================================

CALL sp_GetAssessmentLeaderboard('py_assess_001', 10);


-- ================================================================
-- STEP 9 — STORED PROCEDURE: sp_DeleteOldLoginHistory
-- PURPOSE: DELETE — Purge old login records (data housekeeping)
-- EXPLAIN: "For GDPR and storage compliance, we periodically
--           delete login records older than 90 days."
-- ================================================================

-- Using 9999 days so it shows the logic without deleting our demo data
CALL sp_DeleteOldLoginHistory(9999);

-- To actually delete records older than 90 days use:
-- CALL sp_DeleteOldLoginHistory(90);


-- ================================================================
-- STEP 10 — STORED FUNCTION: fn_GetUserEngagementScore
-- PURPOSE: Calculate user engagement score 0–100
-- EXPLAIN: "A stored function (not procedure) that returns a
--           single value. Formula:
--           = min(logins × 2, 30) + min(assessments × 2, 40)
--                                 + (avg_score × 0.30)"
-- ================================================================

SELECT fn_GetUserEngagementScore('user_demo_001') AS engagement_score;


-- ================================================================
-- STEP 11 — STORED FUNCTION: fn_GetPassRate
-- PURPOSE: Return pass rate % for a given assessment
-- ================================================================

SELECT fn_GetPassRate('py_assess_001') AS pass_rate_percent;


-- ================================================================
-- STEP 12 — STORED FUNCTION: fn_GetAvgScoreBySkill
-- PURPOSE: Platform-wide average score for a skill
-- ================================================================

SELECT fn_GetAvgScoreBySkill('Python') AS python_avg_score;


-- ================================================================
-- STEP 13 — STORED FUNCTION: fn_GetUserTotalLogins
-- PURPOSE: Count total successful logins for a user
-- ================================================================

SELECT fn_GetUserTotalLogins('user_demo_001') AS total_successful_logins;


-- ================================================================
-- STEP 14 — TRIGGER: trg_AfterLoginInsert (AUTOMATIC)
-- PURPOSE: Auto-update user_activity_summary on every login
-- EXPLAIN: "This trigger fires AUTOMATICALLY after every INSERT
--           into login_history. The app doesn't call it — the
--           database handles it on its own."
-- ================================================================

-- Insert a new login (trigger fires automatically behind the scenes)
CALL sp_InsertLoginHistory('trigger_demo_user', 'trigger_demo', '10.0.0.1', 'Firefox', 1, NULL);

-- Check that user_activity_summary was AUTOMATICALLY updated by the trigger
-- (We never manually inserted into user_activity_summary for this user!)
SELECT * FROM user_activity_summary WHERE user_id = 'trigger_demo_user';


-- ================================================================
-- STEP 15 — VIEW ALL TABLES (show what data is stored)
-- ================================================================

SELECT 'login_history'          AS table_name, COUNT(*) AS row_count FROM login_history
UNION ALL
SELECT 'assessment_analytics',                  COUNT(*) FROM assessment_analytics
UNION ALL
SELECT 'platform_stats',                        COUNT(*) FROM platform_stats
UNION ALL
SELECT 'skill_popularity',                      COUNT(*) FROM skill_popularity
UNION ALL
SELECT 'user_activity_summary',                 COUNT(*) FROM user_activity_summary;


-- ================================================================
--  CLEAN UP DEMO DATA (run this AFTER the demo if needed)
-- ================================================================
-- DELETE FROM login_history      WHERE user_id IN ('user_demo_001','trigger_demo_user');
-- DELETE FROM user_activity_summary WHERE user_id IN ('user_demo_001','trigger_demo_user');
-- DELETE FROM assessment_analytics   WHERE assessment_id = 'py_assess_001';
