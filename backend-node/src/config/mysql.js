/**
 * @file mysql.js
 * @description MySQL database connection configuration
 * @author SkillPath Team
 * @created 2026-01-29
 */

const mysql = require('mysql2/promise');

let pool = null;

/**
 * Create MySQL connection pool
 */
async function connectMySQL() {
    try {
        const sslEnabled = process.env.MYSQL_SSL === 'true';
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'skill_career_analytics',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {})
        });

        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected to:', process.env.MYSQL_DATABASE || 'skill_career_analytics');
        connection.release();

        return pool;
    } catch (error) {
        console.error('❌ MySQL connection error:', error.message);
        throw error;
    }
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
    if (!pool) {
        throw new Error('MySQL pool not initialized. Call connectMySQL() first.');
    }
    const [results] = await pool.execute(sql, params);
    return results;
}

/**
 * Get the connection pool
 * @returns {Pool} MySQL connection pool
 */
function getPool() {
    return pool;
}

/**
 * Close all MySQL connections
 */
async function closeMySQL() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('👋 MySQL connection closed');
    }
}

module.exports = {
    connectMySQL,
    query,
    getPool,
    closeMySQL
};
