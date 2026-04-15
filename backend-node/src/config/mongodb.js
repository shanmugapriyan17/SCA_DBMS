/**
 * @file mongodb.js
 * @description MongoDB connection configuration using Mongoose
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectMongoDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_career_db';

        await mongoose.connect(uri, {
            // Mongoose 8+ handles deprecation warnings automatically
        });

        // Connection event handlers
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        throw error;
    }
}

/**
 * Close MongoDB connection (for graceful shutdown)
 * @returns {Promise<void>}
 */
async function closeMongoDB() {
    await mongoose.connection.close();
}

module.exports = { connectMongoDB, closeMongoDB };
