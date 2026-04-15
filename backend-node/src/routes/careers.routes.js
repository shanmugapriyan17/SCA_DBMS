/**
 * @file careers.routes.js
 * @description Career API routes with Neo4j integration for recommendations
 * @author SkillPath Team
 * @created 2026-01-14
 */

const express = require('express');
const { Career, UserSkill, Skill } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');
const { runQuery } = require('../config/neo4j');

const router = express.Router();

// ===========================================
// GET /api/careers - Get all careers
// ===========================================
router.get('/', async (req, res) => {
    try {
        const careers = await Career.find()
            .populate('required_skills.skill_id', 'skill_name icon')
            .sort({ title: 1 });

        res.json({ success: true, data: { careers } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── shared: build recommendations from MongoDB data ────────────────────────
async function buildRecommendationsFromMongo(userSkills) {
    const skillScores = {};
    userSkills.forEach(us => {
        skillScores[us.skill_id.skill_name] = us.score;
    });

    const careers = await Career.find()
        .populate('required_skills.skill_id', 'skill_name icon');

    const recommendations = careers.map(career => {
        let matchScore = 0;
        let totalRequired = 0;
        const skillAnalysis = [];

        for (const req of career.required_skills) {
            if (!req.skill_id) continue;
            const skillName = req.skill_id.skill_name;
            const userScore = skillScores[skillName] || 0;
            const requiredScore = req.required_level;

            totalRequired += requiredScore;
            matchScore += Math.min(userScore, requiredScore);

            skillAnalysis.push({
                skill_name: skillName,
                icon: req.skill_id.icon,
                user_score: userScore,
                required_score: requiredScore,
                met: userScore >= requiredScore
            });
        }

        const matchPercentage = totalRequired > 0
            ? Math.round((matchScore / totalRequired) * 100)
            : 0;

        return {
            career_id: career._id,
            title: career.title,
            description: career.description,
            industry: career.industry,
            avg_salary: career.avg_salary,
            growth_outlook: career.growth_outlook,
            match_percentage: matchPercentage,
            skill_analysis: skillAnalysis
        };
    });

    return recommendations
        .filter(r => r.match_percentage > 0)
        .sort((a, b) => b.match_percentage - a.match_percentage)
        .slice(0, 6);
}

// ===========================================
// GET /api/careers/recommendations
// Tries Neo4j graph traversal first → falls back to MongoDB aggregation
// ===========================================
router.get('/recommendations', authMiddleware, async (req, res) => {
    try {
        // Get user's skill scores from MongoDB
        const userSkills = await UserSkill.find({ user_id: req.userId })
            .populate('skill_id', 'skill_name');

        if (userSkills.length === 0) {
            return res.json({
                success: true,
                data: {
                    recommendations: [],
                    source: 'none',
                    message: 'Take some assessments first to get career recommendations'
                }
            });
        }

        const skillScores = {};
        userSkills.forEach(us => { skillScores[us.skill_id.skill_name] = us.score; });
        const userSkillNames = Object.keys(skillScores);

        // ── Attempt Neo4j graph traversal ────────────────────────────────
        let neo4jRecords = [];
        let neo4jAvailable = false;

        try {
            const neo4jQuery = `
                MATCH (s:Skill)-[r:REQUIRED_FOR]->(c:Career)
                WHERE s.name IN $skills
                WITH c,
                     COLLECT({ skill: s.name, required: r.level }) AS matched_skills,
                     COUNT(s) AS match_count
                RETURN c.id        AS career_id,
                       c.title     AS title,
                       matched_skills,
                       match_count
                ORDER BY match_count DESC
                LIMIT 6
            `;
            neo4jRecords = await runQuery(neo4jQuery, { skills: userSkillNames });
            neo4jAvailable = true;
        } catch (neo4jErr) {
            console.warn('⚠️  Neo4j recommendation query failed, using MongoDB fallback:', neo4jErr.message);
        }

        // ── Neo4j returned data → build full recommendations ─────────────
        if (neo4jAvailable && neo4jRecords.length > 0) {
            const recommendations = [];

            for (const record of neo4jRecords) {
                const careerId = record.get('career_id');
                const career = await Career.findById(careerId)
                    .populate('required_skills.skill_id', 'skill_name icon');

                if (!career) continue;

                let matchScore = 0;
                let totalRequired = 0;
                const skillAnalysis = [];

                for (const rs of career.required_skills) {
                    if (!rs.skill_id) continue;
                    const skillName = rs.skill_id.skill_name;
                    const userScore = skillScores[skillName] || 0;
                    const requiredScore = rs.required_level;

                    totalRequired += requiredScore;
                    matchScore += Math.min(userScore, requiredScore);

                    skillAnalysis.push({
                        skill_name: skillName,
                        icon: rs.skill_id.icon,
                        user_score: userScore,
                        required_score: requiredScore,
                        met: userScore >= requiredScore
                    });
                }

                const matchPercentage = totalRequired > 0
                    ? Math.round((matchScore / totalRequired) * 100)
                    : 0;

                recommendations.push({
                    career_id: career._id,
                    title: career.title,
                    description: career.description,
                    industry: career.industry,
                    avg_salary: career.avg_salary,
                    growth_outlook: career.growth_outlook,
                    match_percentage: matchPercentage,
                    skill_analysis: skillAnalysis
                });
            }

            recommendations.sort((a, b) => b.match_percentage - a.match_percentage);

            return res.json({
                success: true,
                data: { recommendations, source: 'neo4j' }
            });
        }

        // ── Fallback: MongoDB aggregation ────────────────────────────────
        console.log('ℹ️  Using MongoDB fallback for career recommendations');
        const recommendations = await buildRecommendationsFromMongo(userSkills);

        return res.json({
            success: true,
            data: {
                recommendations,
                source: 'mongodb',
                message: neo4jAvailable
                    ? 'Neo4j graph is empty — seed it to enable graph-based recommendations'
                    : 'Neo4j unavailable — using MongoDB-based recommendations'
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ===========================================
// GET /api/careers/:id - Get single career
// ===========================================
router.get('/:id', async (req, res) => {
    try {
        const career = await Career.findById(req.params.id)
            .populate('required_skills.skill_id', 'skill_name icon category');

        if (!career) {
            return res.status(404).json({ success: false, error: 'Career not found' });
        }

        res.json({ success: true, data: { career } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// GET /api/careers/:id/skill-gap - Analyze skill gap for career
// ===========================================
router.get('/:id/skill-gap', authMiddleware, async (req, res) => {
    try {
        const career = await Career.findById(req.params.id)
            .populate('required_skills.skill_id', 'skill_name icon');

        if (!career) {
            return res.status(404).json({ success: false, error: 'Career not found' });
        }

        // Get user's skills
        const userSkills = await UserSkill.find({ user_id: req.userId })
            .populate('skill_id', 'skill_name');

        const skillScores = {};
        userSkills.forEach(us => {
            skillScores[us.skill_id.skill_name] = us.score;
        });

        // Calculate gaps
        const skillGaps = career.required_skills.map(req => {
            const skillName = req.skill_id.skill_name;
            const userScore = skillScores[skillName] || 0;
            const gap = Math.max(0, req.required_level - userScore);

            return {
                skill_name: skillName,
                icon: req.skill_id.icon,
                user_score: userScore,
                required_score: req.required_level,
                gap,
                importance: req.importance
            };
        });

        // Sort by gap (highest first)
        skillGaps.sort((a, b) => b.gap - a.gap);

        res.json({
            success: true,
            data: {
                career_title: career.title,
                skill_gaps: skillGaps,
                skills_to_improve: skillGaps.filter(s => s.gap > 0)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
