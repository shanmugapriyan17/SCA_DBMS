/**
 * @file skills.routes.js
 * @description Skills API routes (list skills, get user skills)
 * @author SkillPath Team
 * @created 2026-01-14
 */

const express = require('express');
const { Skill, UserSkill } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// ===========================================
// GET /api/skills - Get all skills
// ===========================================
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        const filter = {};
        if (category) filter.category = category;

        const skills = await Skill.find(filter).sort({ category: 1, skill_name: 1 });

        res.json({
            success: true,
            data: { skills }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// GET /api/skills/:id - Get single skill
// ===========================================
router.get('/:id', async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({
                success: false,
                error: 'Skill not found'
            });
        }

        res.json({
            success: true,
            data: { skill }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// GET /api/skills/user/me - Get current user's skills
// ===========================================
router.get('/user/me', authMiddleware, async (req, res) => {
    try {
        const userSkills = await UserSkill.find({ user_id: req.userId })
            .populate('skill_id', 'skill_name category icon')
            .sort({ score: -1 });

        res.json({
            success: true,
            data: {
                userSkills: userSkills.map(us => ({
                    skill_id: us.skill_id._id,
                    skill_name: us.skill_id.skill_name,
                    category: us.skill_id.category,
                    icon: us.skill_id.icon,
                    score: us.score,
                    level: us.level,
                    attempts_count: us.attempts_count,
                    last_assessed: us.last_assessed
                }))
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
// GET /api/skills/analytics/distribution - Aggregation Pipeline Demo (Rubric: $match, $group, $project)
// ===========================================
router.get('/analytics/distribution', async (req, res) => {
    try {
        const pipeline = [
            // Stage 1: $lookup to join UserSkill with Skill collection to get the category
            {
                $lookup: {
                    from: "skills",            // Mongoose creates collection named 'skills'
                    localField: "skill_id",
                    foreignField: "_id",
                    as: "skill_details"
                }
            },
            // Stage 2: $unwind the joined array (optional but makes $match easier)
            { $unwind: "$skill_details" },
            
            // Stage 3: $match (Filter out zero scores or inactive records)
            {
                $match: {
                    score: { $gt: 0 }
                }
            },
            // Stage 4: $group (Group by skill category and calculate average score)
            {
                $group: {
                    _id: "$skill_details.category",
                    averageScore: { $avg: "$score" },
                    totalAssessments: { $sum: "$attempts_count" },
                    usersCount: { $sum: 1 }
                }
            },
            // Stage 5: $project (Format the output nicely)
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    averageScore: { $round: ["$averageScore", 2] },
                    totalAssessments: 1,
                    usersCount: 1
                }
            },
            // Stage 6: $sort highest average first
            { $sort: { averageScore: -1 } }
        ];

        const distribution = await UserSkill.aggregate(pipeline);

        res.json({
            success: true,
            message: "Data retrieved using MongoDB aggregation pipeline ($match, $group, $project)",
            data: distribution
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
