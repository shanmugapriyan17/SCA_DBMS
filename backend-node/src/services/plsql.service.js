/**
 * @file plsql.service.js
 * @description Node.js wrapper for all MySQL Stored Procedures & Functions
 *              defined in database/sql/plsql_procedures.sql
 *
 *              Every method maps 1-to-1 to a stored procedure / function
 *              so routes can call clean JS methods instead of raw SQL.
 *
 * @author Smart Career Advisor Team
 * @created 2026-03-28
 *
 * Usage:
 *   const plsql = require('./plsql.service');
 *   await plsql.insertLoginHistory({ userId, username, ip, userAgent, success });
 */

'use strict';

const { query, getPool } = require('../config/mysql');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — call a stored procedure and return all result sets
// ─────────────────────────────────────────────────────────────────────────────
async function callProcedure(name, args = []) {
    const pool = getPool();
    if (!pool) throw new Error('MySQL not connected');

    // Build CALL sp_Name(?,?,?...) placeholder string
    const placeholders = args.map(() => '?').join(', ');
    const sql          = `CALL ${name}(${placeholders})`;

    const [results] = await pool.execute(sql, args);
    return results; // Array of result-sets (one per SELECT in the procedure)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — call a scalar stored function (returns single value)
// ─────────────────────────────────────────────────────────────────────────────
async function callFunction(name, args = []) {
    const placeholders = args.map(() => '?').join(', ');
    const sql          = `SELECT ${name}(${placeholders}) AS result`;
    const rows         = await query(sql, args);
    return rows[0]?.result ?? null;
}


// ═════════════════════════════════════════════════════════════════════════════
//  STORED PROCEDURE WRAPPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * sp_InsertLoginHistory — CREATE
 * Record a login event for a user.
 *
 * @param {Object} params
 * @param {string}  params.userId    - MongoDB user _id
 * @param {string}  params.username  - Username
 * @param {string}  params.ip        - Client IP
 * @param {string}  params.userAgent - Browser agent string
 * @param {boolean} params.success   - true = login OK, false = failed
 * @param {string}  [params.reason]  - Failure reason (null if success)
 * @returns {Promise<Object>} Inserted record summary
 */
async function insertLoginHistory({ userId, username, ip, userAgent, success, reason = null }) {
    const results = await callProcedure('sp_InsertLoginHistory', [
        userId, username, ip, userAgent, success ? 1 : 0, reason
    ]);
    return results[0]?.[0] || null;   // first result-set, first row
}

/**
 * sp_GetUserLoginHistory — READ
 * Retrieve paginated login history for a user.
 *
 * @param {string} userId
 * @param {number} [limit=20]
 * @param {number} [offset=0]
 * @returns {Promise<{ records: Array, total: number }>}
 */
async function getUserLoginHistory(userId, limit = 20, offset = 0) {
    const results = await callProcedure('sp_GetUserLoginHistory', [userId, limit, offset]);
    return {
        records: results[0] || [],                     // first SELECT = data rows
        total:   results[1]?.[0]?.total_records ?? 0   // second SELECT = count
    };
}

/**
 * sp_UpdateAssessmentAnalytics — UPDATE
 * Recalculate rolling stats for an assessment after a new attempt.
 *
 * @param {Object} params
 * @param {string}  params.assessmentId    - MongoDB assessment _id
 * @param {string}  params.assessmentTitle - Human-readable title
 * @param {string}  params.skillName       - Skill name
 * @param {string}  params.difficulty      - beginner | intermediate | advanced
 * @param {number}  params.score           - New attempt score (0–100)
 * @param {number}  params.timeSeconds     - Seconds taken
 * @param {boolean} params.passed          - Score >= 60
 * @returns {Promise<Object>} Updated analytics row
 */
async function updateAssessmentAnalytics({
    assessmentId, assessmentTitle, skillName, difficulty, score, timeSeconds, passed
}) {
    const results = await callProcedure('sp_UpdateAssessmentAnalytics', [
        assessmentId, assessmentTitle, skillName, difficulty,
        score, timeSeconds, passed ? 1 : 0
    ]);
    return results[0]?.[0] || null;
}

/**
 * sp_DeleteOldLoginHistory — DELETE
 * Purge login records older than the specified number of days.
 *
 * @param {number} [daysOld=90]
 * @returns {Promise<Object>} { deleted_rows, cutoff_date, message }
 */
async function deleteOldLoginHistory(daysOld = 90) {
    const results = await callProcedure('sp_DeleteOldLoginHistory', [daysOld]);
    return results[0]?.[0] || null;
}

/**
 * sp_GetTopSkills — READ
 * Return top N skills by popularity, optionally filtered by category.
 *
 * @param {number} [limit=10]
 * @param {string} [category=null]  - e.g. 'Programming', null = all
 * @returns {Promise<Array>}
 */
async function getTopSkills(limit = 10, category = null) {
    const results = await callProcedure('sp_GetTopSkills', [limit, category]);
    return results[0] || [];
}

/**
 * sp_UpsertUserActivitySummary — CREATE / UPDATE
 * Insert or update a user's engagement summary row.
 *
 * @param {Object} params
 * @param {string} params.userId           - MongoDB user _id
 * @param {number} [params.loginsToAdd=0]
 * @param {number} [params.assessmentsToAdd=0]
 * @param {number} [params.newScore=null]  - Latest score (null = skip avg update)
 * @param {string} [params.accountCreated] - ISO date string 'YYYY-MM-DD'
 * @returns {Promise<Object>} Updated summary row
 */
async function upsertUserActivitySummary({
    userId,
    loginsToAdd     = 0,
    assessmentsToAdd = 0,
    newScore        = null,
    accountCreated  = null
}) {
    const results = await callProcedure('sp_UpsertUserActivitySummary', [
        userId, loginsToAdd, assessmentsToAdd, newScore, accountCreated
    ]);
    return results[0]?.[0] || null;
}

/**
 * sp_GetDashboardSummary — READ
 * Platform-wide dashboard data for the admin panel.
 *
 * @param {number} [days=30] - Look-back window
 * @returns {Promise<{ platformStats: Object, topSkills: Array, loginTrend: Array }>}
 */
async function getDashboardSummary(days = 30) {
    const results = await callProcedure('sp_GetDashboardSummary', [days]);
    return {
        platformStats: results[0]?.[0] || {},
        topSkills:     results[1]     || [],
        loginTrend:    results[2]     || []
    };
}

/**
 * sp_GetAssessmentLeaderboard — READ
 * Detailed stats and top users for a given assessment.
 *
 * @param {string} assessmentId - MongoDB assessment _id
 * @param {number} [topN=10]
 * @returns {Promise<{ assessmentStats: Object, topUsers: Array }>}
 */
async function getAssessmentLeaderboard(assessmentId, topN = 10) {
    const results = await callProcedure('sp_GetAssessmentLeaderboard', [assessmentId, topN]);
    return {
        assessmentStats: results[0]?.[0] || {},
        topUsers:        results[1]     || []
    };
}


// ═════════════════════════════════════════════════════════════════════════════
//  STORED FUNCTION WRAPPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * fn_GetUserEngagementScore
 * Calculate and return a user's engagement score (0–100).
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUserEngagementScore(userId) {
    return callFunction('fn_GetUserEngagementScore', [userId]);
}

/**
 * fn_GetPassRate
 * Return current pass rate percentage for a given assessment.
 *
 * @param {string} assessmentId - MongoDB assessment _id
 * @returns {Promise<number>} 0.00 – 100.00
 */
async function getPassRate(assessmentId) {
    return callFunction('fn_GetPassRate', [assessmentId]);
}

/**
 * fn_GetAvgScoreBySkill
 * Return platform-wide average score for a skill name.
 *
 * @param {string} skillName - e.g. 'Python'
 * @returns {Promise<number>} 0.00 – 100.00
 */
async function getAvgScoreBySkill(skillName) {
    return callFunction('fn_GetAvgScoreBySkill', [skillName]);
}

/**
 * fn_GetUserTotalLogins
 * Return the total count of SUCCESSFUL logins for a user.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUserTotalLogins(userId) {
    return callFunction('fn_GetUserTotalLogins', [userId]);
}


// ═════════════════════════════════════════════════════════════════════════════
//  SETUP — Run the SQL file to create procedures/functions/triggers
// ═════════════════════════════════════════════════════════════════════════════

/**
 * installProcedures
 * Reads and executes plsql_procedures.sql against the MySQL database.
 * Call this once on startup or during migration.
 *
 * @returns {Promise<void>}
 */
async function installProcedures() {
    const fs   = require('fs');
    const path = require('path');
    const pool = getPool();
    if (!pool) throw new Error('MySQL not connected');

    const sqlFile = path.join(__dirname, '../../database/sql/plsql_procedures.sql');
    if (!fs.existsSync(sqlFile)) {
        console.warn('⚠️  plsql_procedures.sql not found — skipping install');
        return;
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split on DELIMITER markers — MySQL2 doesn't support DELIMITER natively
    // We strip DELIMITER $$ and split on $$ to run each block individually
    const cleaned = sqlContent
        .replace(/^USE\s+\S+;?\s*/gim, '')          // skip USE statement (already connected)
        .replace(/DELIMITER\s+\$\$/gim, '')
        .replace(/DELIMITER\s+;/gim, '');

    const blocks = cleaned.split('$$').map(b => b.trim()).filter(Boolean);

    const conn = await pool.getConnection();
    try {
        for (const block of blocks) {
            if (block.startsWith('--') || block.startsWith('SELECT')) continue; // skip comments & selects
            try {
                await conn.query(block);
            } catch (err) {
                // Log but continue — some blocks may be DROP IF EXISTS on non-existant objects
                if (!err.message.includes('does not exist')) {
                    console.error('PL/SQL install warning:', err.message.slice(0, 120));
                }
            }
        }
        console.log('✅ PL/SQL procedures, functions & triggers installed');
    } finally {
        conn.release();
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    // Procedures
    insertLoginHistory,
    getUserLoginHistory,
    updateAssessmentAnalytics,
    deleteOldLoginHistory,
    getTopSkills,
    upsertUserActivitySummary,
    getDashboardSummary,
    getAssessmentLeaderboard,

    // Functions
    getUserEngagementScore,
    getPassRate,
    getAvgScoreBySkill,
    getUserTotalLogins,

    // Setup
    installProcedures,

    // Raw caller (for custom queries)
    callProcedure,
    callFunction
};
