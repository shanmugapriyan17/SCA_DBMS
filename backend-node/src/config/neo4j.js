/**
 * @file neo4j.js
 * @description Neo4j graph database connection configuration
 * @author SkillPath Team
 * @created 2026-01-14
 */

const neo4j = require('neo4j-driver');

let driver = null;

/**
 * Connect to Neo4j database
 * @returns {Promise<void>}
 */
async function connectNeo4j() {
    try {
        const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';

        // Auto-detect encryption: AuraDB uses neo4j+s:// (always encrypted)
        // Local Neo4j Desktop uses neo4j:// or bolt:// (no encryption needed)
        const isCloud = uri.startsWith('neo4j+s://') || uri.startsWith('bolt+s://');
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
            disableLosslessIntegers: true,
            ...(isCloud ? {} : { encrypted: 'ENCRYPTION_OFF' })
        });

        // Verify connection
        await driver.verifyConnectivity();

    } catch (error) {
        console.error('Failed to connect to Neo4j:', error.message);
        throw error;
    }
}

/**
 * Get Neo4j session for queries
 * @returns {Session} Neo4j session instance
 */
function getSession() {
    if (!driver) {
        throw new Error('Neo4j driver not initialized');
    }
    return driver.session();
}

/**
 * Run a Cypher query
 * @param {string} query - Cypher query string
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function runQuery(query, params = {}) {
    const session = getSession();
    try {
        const result = await session.run(query, params);
        return result.records;
    } finally {
        await session.close();
    }
}

/**
 * Close Neo4j connection (for graceful shutdown)
 * @returns {Promise<void>}
 */
async function closeNeo4j() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

module.exports = {
    connectNeo4j,
    closeNeo4j,
    getSession,
    runQuery
};
