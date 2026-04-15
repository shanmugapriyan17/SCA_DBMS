/**
 * @file auth.routes.js
 * @description Authentication API routes (register, login, logout, me)
 *              Syncs user data across MongoDB, Neo4j, and MySQL
 * @author SkillPath Team
 * @created 2026-01-14
 * @updated 2026-02-11 - Added multi-database sync
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');
const { JWT_CONFIG } = require('../config/constants');
const { runQuery } = require('../config/neo4j');
const { query: sqlQuery } = require('../config/mysql');

const router = express.Router();

/**
 * Generate JWT token for user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
function generateToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: JWT_CONFIG.expiresIn }
    );
}

/**
 * Sync new user to Neo4j (create User node)
 * Non-blocking — won't break auth if Neo4j is down
 */
async function syncUserToNeo4j(user) {
    try {
        await runQuery(
            `MERGE (u:User {id: $id})
             SET u.username = $username,
                 u.email = $email,
                 u.full_name = $fullName,
                 u.created_at = datetime()`,
            {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                fullName: user.profile?.full_name || user.username
            }
        );
        console.log(`✅ Neo4j: User node created for ${user.username}`);
    } catch (error) {
        console.log(`⚠️  Neo4j sync skipped: ${error.message}`);
    }
}

/**
 * Create initial user_activity_summary row in MySQL
 * Non-blocking — won't break auth if MySQL is down
 */
async function createUserActivityInMySQL(user) {
    try {
        await sqlQuery(
            `INSERT INTO user_activity_summary 
             (user_id, total_logins, total_assessments, total_skills_learned, 
              avg_assessment_score, account_created, engagement_score)
             VALUES (?, 0, 0, 0, 0.00, CURDATE(), 0)
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [user._id.toString()]
        );
        console.log(`✅ MySQL: Activity summary created for ${user.username}`);
    } catch (error) {
        console.log(`⚠️  MySQL activity sync skipped: ${error.message}`);
    }
}

/**
 * Record login event in MySQL (login_history + update user_activity_summary)
 * Non-blocking — won't break auth if MySQL is down
 */
async function recordLoginInMySQL(user, req, success = true, reason = null) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Call PL/SQL stored procedure — trigger fires automatically inside
        await sqlQuery(
            `CALL sp_InsertLoginHistory(?, ?, ?, ?, ?, ?)`,
            [user._id.toString(), user.username, ip, userAgent, success ? 1 : 0, reason]
        );

        // Also call UpsertUserActivitySummary via stored procedure
        const accountCreated = user.createdAt
            ? user.createdAt.toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        await sqlQuery(
            `CALL sp_UpsertUserActivitySummary(?, ?, ?, ?, ?)`,
            [user._id.toString(), 1, 0, null, accountCreated]
        );

        console.log(`✅ MySQL (PL/SQL): Login recorded for ${user.username}`);
    } catch (error) {
        console.log(`⚠️  MySQL login sync skipped: ${error.message}`);
    }
}


// ===========================================
// POST /api/auth/register - Create new user
// ===========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // 1) MongoDB — Create user (primary)
        const user = new User({
            username,
            email,
            password_hash: password,  // Will be hashed by pre-save hook
            profile: { full_name: full_name || username }
        });
        await user.save();

        // 2) Neo4j — Create User node (non-blocking)
        syncUserToNeo4j(user);

        // 3) MySQL — Create user_activity_summary row (non-blocking)
        createUserActivityInMySQL(user);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user,
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// POST /api/auth/login - User login
// ===========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // 1) MongoDB — Find & verify user (primary)
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // 2) MySQL — Record login event (non-blocking)
        recordLoginInMySQL(user, req);

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                user,
                token
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// GET /api/auth/me - Get current user
// ===========================================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// POST /api/auth/logout - Logout (client-side)
// ===========================================
router.post('/logout', authMiddleware, (req, res) => {
    // JWT is stateless, logout is handled client-side
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
