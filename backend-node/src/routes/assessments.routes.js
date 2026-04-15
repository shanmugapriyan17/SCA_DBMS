/**
 * @file assessments.routes.js
 * @description Assessment API routes (list, take test, submit)
 * @author SkillPath Team
 * @created 2026-01-14
 */

const express = require('express');
const { Assessment, Question, Attempt, UserSkill } = require('../models');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getSkillLevel } = require('../config/constants');
const { query: sqlQuery } = require('../config/mysql');

// Helper: sync assessment to MySQL assessment_analytics (fire-and-forget)
async function syncAssessmentToSQL(assessment) {
    try {
        const skillName = assessment.skill_ids && assessment.skill_ids[0]
            ? (assessment.skill_ids[0].skill_name || String(assessment.skill_ids[0]))
            : 'General';
        await sqlQuery(
            `INSERT INTO assessment_analytics (assessment_id, assessment_title, skill_name, difficulty)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                assessment_title = VALUES(assessment_title),
                skill_name       = VALUES(skill_name),
                difficulty       = VALUES(difficulty),
                last_updated     = CURRENT_TIMESTAMP`,
            [assessment._id.toString(), assessment.title, skillName, assessment.difficulty]
        );
    } catch (err) {
        console.warn('⚠️  MySQL sync skipped (assessment_analytics):', err.message);
    }
}

// Helper: delete assessment from MySQL
async function deleteAssessmentFromSQL(assessmentId) {
    try {
        await sqlQuery(
            `DELETE FROM assessment_analytics WHERE assessment_id = ?`,
            [assessmentId]
        );
    } catch (err) {
        console.warn('⚠️  MySQL delete skipped (assessment_analytics):', err.message);
    }
}

const router = express.Router();

// ===========================================
// GET /api/assessments - Get all assessments
// ===========================================
router.get('/', async (req, res) => {
    try {
        const { career_role, difficulty, showAll } = req.query;
        const filter = {};

        // Default: only active. Pass showAll=true from Manage page to see all
        if (!showAll || showAll !== 'true') {
            filter.is_active = true;
        }

        if (career_role) filter.career_role = career_role;
        if (difficulty) filter.difficulty = difficulty;

        const assessments = await Assessment.find(filter)
            .populate('skill_ids', 'skill_name icon')
            .populate('career_id', 'title')
            .sort({ career_role: 1, difficulty: 1, createdAt: -1 });

        res.json({
            success: true,
            data: { assessments }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ===========================================
// GET /api/assessments/:id - Get single assessment
// ===========================================
router.get('/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .populate('skill_ids', 'skill_name icon category');

        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        res.json({ success: true, data: { assessment } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// POST /api/assessments/:id/start - Start an assessment
// ===========================================
router.post('/:id/start', authMiddleware, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        // Get random questions for this assessment's skills
        const questions = await Question.aggregate([
            { $match: { skill_id: { $in: assessment.skill_ids } } },
            { $sample: { size: assessment.question_count } }
        ]);

        // Create attempt
        const attempt = new Attempt({
            user_id: req.userId,
            assessment_id: assessment._id,
            answers: questions.map(q => ({ question_id: q._id }))
        });
        await attempt.save();

        // Return questions without correct answers
        const safeQuestions = questions.map(q => ({
            _id: q._id,
            content: q.content,
            options: q.options,
            difficulty: q.difficulty
        }));

        res.status(201).json({
            success: true,
            data: {
                attempt_id: attempt._id,
                time_limit: assessment.time_limit,
                assessment_title: assessment.title,
                career_role: assessment.career_role,
                difficulty: assessment.difficulty,
                questions: safeQuestions
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// POST /api/assessments/attempt/:attemptId/answer - Submit answer
// ===========================================
router.post('/attempt/:attemptId/answer', authMiddleware, async (req, res) => {
    try {
        const { question_id, answer } = req.body;

        const attempt = await Attempt.findOne({
            _id: req.params.attemptId,
            user_id: req.userId,
            status: 'in_progress'
        });

        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }

        // Find question to check answer
        const question = await Question.findById(question_id);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        const is_correct = answer === question.correct_answer;

        // Update answer in attempt
        const answerIndex = attempt.answers.findIndex(
            a => a.question_id.toString() === question_id
        );

        if (answerIndex !== -1) {
            attempt.answers[answerIndex].user_answer = answer;
            attempt.answers[answerIndex].is_correct = is_correct;
            attempt.answers[answerIndex].marks_obtained = is_correct ? question.max_marks : 0;
        }

        await attempt.save();

        res.json({ success: true, data: { is_correct } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// POST /api/assessments/attempt/:attemptId/submit - Complete assessment
// ===========================================
router.post('/attempt/:attemptId/submit', authMiddleware, async (req, res) => {
    try {
        const attempt = await Attempt.findOne({
            _id: req.params.attemptId,
            user_id: req.userId,
            status: 'in_progress'
        }).populate({
            path: 'assessment_id',
            populate: { path: 'skill_ids' }
        });

        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }

        // Calculate scores
        const totalMarks = attempt.answers.reduce((sum, a) => sum + a.marks_obtained, 0);
        const maxMarks = attempt.answers.length;
        const percentage = Math.round((totalMarks / maxMarks) * 100);

        // Update attempt
        attempt.status = 'completed';
        attempt.finished_at = new Date();
        attempt.total_score = totalMarks;
        attempt.percentage = percentage;
        await attempt.save();

        // Update user skills
        for (const skillId of attempt.assessment_id.skill_ids) {
            await UserSkill.findOneAndUpdate(
                { user_id: req.userId, skill_id: skillId },
                {
                    $set: {
                        score: percentage,
                        level: getSkillLevel(percentage),
                        last_assessed: new Date()
                    },
                    $inc: { attempts_count: 1 }
                },
                { upsert: true, new: true }
            );
        }

        // ─── PL/SQL: Update MySQL analytics (fire-and-forget) ───
        const assessmentDoc = attempt.assessment_id;
        const skillName = assessmentDoc.skill_ids?.[0]?.skill_name || 'General';
        const timeTaken = attempt.finished_at
            ? Math.round((new Date(attempt.finished_at) - new Date(attempt.started_at || attempt.createdAt)) / 1000)
            : 0;

        sqlQuery('CALL sp_UpdateAssessmentAnalytics(?, ?, ?, ?, ?, ?, ?)', [
            assessmentDoc._id.toString(),
            assessmentDoc.title,
            skillName,
            assessmentDoc.difficulty,
            percentage,
            timeTaken,
            percentage >= 60 ? 1 : 0
        ]).catch(e => console.warn('⚠️  MySQL analytics sync skipped:', e.message));

        sqlQuery('CALL sp_UpsertUserActivitySummary(?, ?, ?, ?, ?)', [
            req.userId, 0, 1, percentage, null
        ]).catch(e => console.warn('⚠️  MySQL activity sync skipped:', e.message));
        // ─────────────────────────────────────────────────────────

        res.json({
            success: true,
            data: {
                total_score: totalMarks,
                max_score: maxMarks,
                percentage,
                passed: percentage >= 60,
                level: getSkillLevel(percentage),
                answers: attempt.answers.map(a => ({
                    question_id: a.question_id,
                    user_answer: a.user_answer,
                    is_correct: a.is_correct,
                    marks_obtained: a.marks_obtained
                }))
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// GET /api/assessments/attempts/history - Get user's attempt history
// ===========================================
router.get('/attempts/history', authMiddleware, async (req, res) => {
    try {
        const attemptsRaw = await Attempt.find({
            user_id: req.userId,
            status: 'completed'
        })
            .populate('assessment_id', 'title difficulty career_role')
            .sort({ finished_at: -1 })
            .limit(20);

        // Normalize field names so frontend always gets `completed_at` and `percentage`
        const attempts = attemptsRaw.map(a => {
            const totalMarks = a.answers.reduce((s, ans) => s + (ans.marks_obtained || 0), 0);
            const maxMarks = a.answers.length || 1;
            const pct = a.percentage ?? Math.round((totalMarks / maxMarks) * 100);
            return {
                _id: a._id,
                assessment_id: a.assessment_id,
                total_score: totalMarks,
                max_score: maxMarks,
                percentage: pct,
                level: a.level || getSkillLevel(pct),
                completed_at: a.finished_at || a.createdAt,
                status: a.status
            };
        });

        res.json({ success: true, data: { attempts } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// POST /api/assessments - Create new assessment
// ===========================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, skill_ids, question_count, time_limit, difficulty } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const assessment = new Assessment({
            title,
            description,
            skill_ids: skill_ids || [],
            question_count: question_count || 10,
            time_limit: time_limit || 15,
            difficulty: difficulty || 'beginner',
            is_active: true
        });

        await assessment.save();
        await assessment.populate('skill_ids', 'skill_name icon');

        // Sync to MySQL
        await syncAssessmentToSQL(assessment);

        res.status(201).json({ success: true, data: { assessment } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// PUT /api/assessments/:id - Update assessment
// ===========================================
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, skill_ids, question_count, time_limit, difficulty, is_active } = req.body;

        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        if (title !== undefined) assessment.title = title;
        if (description !== undefined) assessment.description = description;
        if (skill_ids !== undefined) assessment.skill_ids = skill_ids;
        if (question_count !== undefined) assessment.question_count = question_count;
        if (time_limit !== undefined) assessment.time_limit = time_limit;
        if (difficulty !== undefined) assessment.difficulty = difficulty;
        if (is_active !== undefined) assessment.is_active = is_active;

        await assessment.save();
        await assessment.populate('skill_ids', 'skill_name icon');

        // Sync to MySQL
        await syncAssessmentToSQL(assessment);

        res.json({ success: true, data: { assessment } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// DELETE /api/assessments/:id - Soft-delete assessment
// ===========================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        assessment.is_active = false;
        await assessment.save();

        // Remove from MySQL analytics
        await deleteAssessmentFromSQL(assessment._id.toString());

        res.json({ success: true, message: 'Assessment deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// GET /api/assessments/:id/questions - List questions for assessment
// ===========================================
router.get('/:id/questions', authMiddleware, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        const questions = await Question.find({ skill_id: { $in: assessment.skill_ids } })
            .populate('skill_id', 'skill_name')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: { questions } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// POST /api/assessments/:id/questions - Add question to assessment
// ===========================================
router.post('/:id/questions', authMiddleware, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        const { skill_id, content, options, correct_answer, difficulty, explanation } = req.body;

        // Use provided skill_id or default to assessment's first skill
        const questionSkillId = skill_id || assessment.skill_ids[0];
        if (!questionSkillId) {
            return res.status(400).json({ success: false, error: 'No skill associated with this assessment' });
        }

        const question = new Question({
            skill_id: questionSkillId,
            content,
            options,
            correct_answer,
            difficulty: difficulty || 1,
            explanation
        });

        await question.save();

        res.status(201).json({ success: true, data: { question } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// PUT /api/assessments/questions/:qid - Update a question
// ===========================================
router.put('/questions/:qid', authMiddleware, async (req, res) => {
    try {
        const question = await Question.findById(req.params.qid);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        const { content, options, correct_answer, difficulty, explanation, skill_id } = req.body;

        if (content !== undefined) question.content = content;
        if (options !== undefined) question.options = options;
        if (correct_answer !== undefined) question.correct_answer = correct_answer;
        if (difficulty !== undefined) question.difficulty = difficulty;
        if (explanation !== undefined) question.explanation = explanation;
        if (skill_id !== undefined) question.skill_id = skill_id;

        await question.save();

        res.json({ success: true, data: { question } });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===========================================
// DELETE /api/assessments/questions/:qid - Delete a question
// ===========================================
router.delete('/questions/:qid', authMiddleware, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.qid);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        res.json({ success: true, message: 'Question deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
