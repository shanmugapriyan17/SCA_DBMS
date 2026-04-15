/**
 * @file admin.routes.js
 * @description Admin routes — seed endpoint for cloud deployment
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { connectNeo4j, runQuery, closeNeo4j } = require('../config/neo4j');
const { Skill, Question, Assessment, Career, User } = require('../models');

const skillsData = require('../../database/seed/skills.json');
const questionsData = require('../../database/seed/questions.json');
const careersData = require('../../database/seed/careers.json');

// POST /api/admin/seed?key=<SEED_SECRET>
router.post('/seed', async (req, res) => {
    const key = req.query.key || req.body.key;
    const secret = process.env.SEED_SECRET || 'sca_seed_2026';

    if (key !== secret) {
        return res.status(401).json({ success: false, error: 'Unauthorized: invalid seed key' });
    }

    const results = { steps: [], errors: [] };

    try {
        // ── 1. Clear existing data ──────────────────────────────────
        await Skill.deleteMany({});
        await Question.deleteMany({});
        await Assessment.deleteMany({});
        await Career.deleteMany({});
        await User.deleteMany({ username: 'admin' });
        results.steps.push('🗑️  Cleared existing seed data');

        // ── 2. Default admin user ──────────────────────────────────
        const adminUser = new User({
            username: 'admin',
            email: 'admin@sca.com',
            password_hash: 'Admin@1234',
            profile: { full_name: 'System Admin' }
        });
        await adminUser.save();
        results.steps.push('👤 Admin user created: admin@sca.com / Admin@1234');

        // ── 3. Skills ──────────────────────────────────────────────
        const skills = await Skill.insertMany(skillsData);
        results.steps.push(`📚 ${skills.length} skills seeded into MongoDB`);

        // ── 4. Neo4j skill nodes ───────────────────────────────────
        let neo4jAvailable = false;
        try {
            await connectNeo4j();
            neo4jAvailable = true;
            await runQuery('MATCH (n) DETACH DELETE n'); // clear Neo4j
            for (const skill of skills) {
                await runQuery(
                    'CREATE (s:Skill {id: $id, name: $name, category: $category})',
                    { id: skill._id.toString(), name: skill.skill_name, category: skill.category }
                );
            }
            results.steps.push(`🕸️  ${skills.length} skill nodes created in Neo4j`);
        } catch (err) {
            results.errors.push(`⚠️  Neo4j skipped: ${err.message}`);
        }

        // ── 5. Questions ───────────────────────────────────────────
        const skillMap = {};
        skills.forEach(s => { skillMap[s.skill_name] = s._id; });

        const questions = [];
        for (const skillSet of questionsData) {
            const skillId = skillMap[skillSet.skill_name];
            if (!skillId) continue;
            for (const q of skillSet.questions) {
                questions.push({
                    skill_id: skillId,
                    content: q.content,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    difficulty: q.difficulty,
                    explanation: q.explanation,
                    question_type: 'mcq',
                    max_marks: 1
                });
            }
        }
        await Question.insertMany(questions);
        results.steps.push(`❓ ${questions.length} questions seeded`);

        // ── 6. Assessments ─────────────────────────────────────────
        const assessments = [
            { title: 'Python Fundamentals', description: 'Test your Python basics', skill_ids: [skillMap['Python']], question_count: 5, time_limit: 10, difficulty: 'beginner' },
            { title: 'JavaScript Essentials', description: 'JS from variables to promises', skill_ids: [skillMap['JavaScript']], question_count: 5, time_limit: 10, difficulty: 'intermediate' },
            { title: 'SQL Proficiency', description: 'Database query skills', skill_ids: [skillMap['SQL']], question_count: 5, time_limit: 10, difficulty: 'beginner' },
            { title: 'React Developer', description: 'Frontend React.js skills', skill_ids: [skillMap['React']], question_count: 5, time_limit: 10, difficulty: 'intermediate' },
            { title: 'Machine Learning Basics', description: 'ML concepts & algorithms', skill_ids: [skillMap['Machine Learning']], question_count: 5, time_limit: 15, difficulty: 'advanced' },
        ].filter(a => a.skill_ids[0]); // skip if skill not found

        await Assessment.insertMany(assessments);
        results.steps.push(`📝 ${assessments.length} assessments seeded`);

        // ── 7. Careers ─────────────────────────────────────────────
        const careers = [];
        for (const c of careersData) {
            careers.push({
                title: c.title,
                description: c.description,
                industry: c.industry,
                required_skills: c.required_skills.map(rs => ({
                    skill_id: skillMap[rs.skill_name],
                    required_level: rs.required_level,
                    importance: rs.importance
                })).filter(rs => rs.skill_id),
                avg_salary: c.avg_salary,
                growth_outlook: c.growth_outlook
            });
        }
        const createdCareers = await Career.insertMany(careers);
        results.steps.push(`🎯 ${createdCareers.length} careers seeded`);

        // ── 8. Neo4j career nodes & relationships ──────────────────
        if (neo4jAvailable) {
            for (let i = 0; i < createdCareers.length; i++) {
                const career = createdCareers[i];
                const careerRaw = careersData[i];
                await runQuery(
                    'CREATE (c:Career {id: $id, title: $title, industry: $industry})',
                    { id: career._id.toString(), title: career.title, industry: career.industry }
                );
                for (const rs of careerRaw.required_skills) {
                    const sid = skillMap[rs.skill_name];
                    if (sid) {
                        await runQuery(
                            `MATCH (s:Skill {id: $skillId}), (c:Career {id: $careerId})
                             CREATE (s)-[:REQUIRED_FOR {level: $level, importance: $importance}]->(c)`,
                            { skillId: sid.toString(), careerId: career._id.toString(), level: rs.required_level, importance: rs.importance }
                        );
                    }
                }
            }
            // Career progressions
            const progressions = [
                { from: 'Data Analyst', to: 'Data Scientist', years: 2 },
                { from: 'Frontend Developer', to: 'Full Stack Developer', years: 2 },
                { from: 'Backend Developer', to: 'Full Stack Developer', years: 2 },
                { from: 'Data Scientist', to: 'ML Engineer', years: 3 },
            ];
            for (const p of progressions) {
                await runQuery(
                    `MATCH (c1:Career {title: $from}), (c2:Career {title: $to})
                     CREATE (c1)-[:LEADS_TO {years_experience: $years}]->(c2)`,
                    p
                );
            }
            results.steps.push('🕸️  Neo4j career nodes & progression paths created');
        }

        return res.json({
            success: true,
            message: '🎉 Database seeded successfully!',
            results
        });

    } catch (err) {
        console.error('Seed error:', err);
        return res.status(500).json({ success: false, error: err.message, results });
    }
});

module.exports = router;
