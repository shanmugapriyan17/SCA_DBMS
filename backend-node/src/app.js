/**
 * @file app.js
 * @description Main Express application - Server entry point
 * @author SkillPath Team
 * @created 2026-01-14
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongoDB } = require('./config/mongodb');
const { connectNeo4j, closeNeo4j } = require('./config/neo4j');
const { connectMySQL, closeMySQL } = require('./config/mysql');

// Import routes
const authRoutes = require('./routes/auth.routes');
const skillRoutes = require('./routes/skills.routes');
const assessmentRoutes = require('./routes/assessments.routes');
const careerRoutes = require('./routes/careers.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 10000;

// ===========================================
// MIDDLEWARE
// ===========================================

// Enable CORS for frontend
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any vercel.app subdomain (covers preview + production deploys)
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Allow any onrender.com subdomain (backend health checks)
        if (origin.endsWith('.onrender.com')) return callback(null, true);
        // Allow configured origins (localhost dev + custom domain)
        if (allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, '')))) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ===========================================
// ROUTES
// ===========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SkillPath API'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/analytics', analyticsRoutes);  // SQL-based analytics

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error'
    });
});

// ===========================================
// SERVER STARTUP
// ===========================================

/**
 * Initialize database connections and start server
 */
async function startServer() {
    try {
        // Connect to MongoDB
        await connectMongoDB();
        console.log('✅ MongoDB connected');

        // Try to connect to Neo4j (optional for basic functionality)
        try {
            await connectNeo4j();
            console.log('✅ Neo4j connected');
        } catch (neo4jError) {
            console.log('⚠️  Neo4j not available - career recommendations will be limited');
        }

        // Try to connect to MySQL (optional for analytics)
        try {
            await connectMySQL();
            console.log('✅ MySQL connected');
        } catch (mysqlError) {
            console.log('⚠️  MySQL not available - analytics will be limited');
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
            console.log(`📈 Analytics API: http://localhost:${PORT}/api/analytics/dashboard`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await closeNeo4j();
    await closeMySQL();
    process.exit(0);
});

startServer();

module.exports = app;
