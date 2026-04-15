/**
 * @file analytics.routes.js
 * @description API routes for SQL-based analytics data
 * @author SkillPath Team
 * @created 2026-01-29
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/mysql');

// ============================================
// GET /api/analytics/dashboard
// Returns platform-wide statistics
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        // Get latest platform stats
        const platformStats = await query(
            `SELECT * FROM platform_stats ORDER BY stat_date DESC LIMIT 7`
        );

        // Get total counts
        const [totals] = await query(
            `SELECT 
                (SELECT COUNT(*) FROM login_history WHERE success = 1) as total_logins,
                (SELECT SUM(total_attempts) FROM assessment_analytics) as total_assessments,
                (SELECT COUNT(*) FROM skill_popularity) as total_skills`
        );

        // Get top performing skills
        const topSkills = await query(
            `SELECT skill_name, category, total_assessments, avg_proficiency, trend 
             FROM skill_popularity 
             ORDER BY total_assessments DESC LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                dailyStats: platformStats,
                totals: totals,
                topSkills: topSkills
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/assessments
// Returns assessment performance analytics
// ============================================
router.get('/assessments', async (req, res) => {
    try {
        const assessments = await query(
            `SELECT 
                assessment_title, skill_name, difficulty,
                total_attempts, total_completions, 
                avg_score, highest_score, lowest_score,
                pass_rate, avg_time_seconds,
                last_updated
             FROM assessment_analytics
             ORDER BY total_attempts DESC`
        );

        res.json({
            success: true,
            data: assessments
        });
    } catch (error) {
        console.error('Assessment analytics error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/assessments/:id
// Returns single assessment analytics
// ============================================
router.get('/assessments/:id', async (req, res) => {
    try {
        const [assessment] = await query(
            `SELECT * FROM assessment_analytics WHERE assessment_id = ?`,
            [req.params.id]
        );

        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        res.json({
            success: true,
            data: assessment
        });
    } catch (error) {
        console.error('Assessment detail error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/logins/:userId
// Returns user login history
// ============================================
router.get('/logins/:userId', async (req, res) => {
    try {
        const logins = await query(
            `SELECT id, username, login_time, ip_address, user_agent, success, failure_reason
             FROM login_history 
             WHERE user_id = ?
             ORDER BY login_time DESC
             LIMIT 50`,
            [req.params.userId]
        );

        res.json({
            success: true,
            data: logins
        });
    } catch (error) {
        console.error('Login history error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/skills
// Returns skill popularity data
// ============================================
router.get('/skills', async (req, res) => {
    try {
        const skills = await query(
            `SELECT skill_name, category, total_assessments, unique_users, avg_proficiency, trend, updated_at
             FROM skill_popularity
             ORDER BY total_assessments DESC`
        );

        res.json({
            success: true,
            data: skills
        });
    } catch (error) {
        console.error('Skill popularity error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/users
// Returns user activity summaries
// ============================================
router.get('/users', async (req, res) => {
    try {
        const users = await query(
            `SELECT user_id, total_logins, total_assessments, total_skills_learned,
                    avg_assessment_score, last_login, last_assessment, engagement_score
             FROM user_activity_summary
             ORDER BY engagement_score DESC`
        );

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('User activity error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/analytics/users/:userId
// Returns specific user activity
// ============================================
router.get('/users/:userId', async (req, res) => {
    try {
        const [user] = await query(
            `SELECT * FROM user_activity_summary WHERE user_id = ?`,
            [req.params.userId]
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Also get login history
        const logins = await query(
            `SELECT login_time, ip_address, success 
             FROM login_history 
             WHERE user_id = ? 
             ORDER BY login_time DESC LIMIT 10`,
            [req.params.userId]
        );

        res.json({
            success: true,
            data: {
                ...user,
                recentLogins: logins
            }
        });
    } catch (error) {
        console.error('User detail error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/analytics/login (Internal use)
// Records a login event
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { user_id, username, ip_address, user_agent, success, failure_reason } = req.body;

        await query(
            `INSERT INTO login_history (user_id, username, ip_address, user_agent, success, failure_reason)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, username, ip_address, user_agent, success !== false, failure_reason || null]
        );

        res.json({ success: true, message: 'Login recorded' });
    } catch (error) {
        console.error('Record login error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
