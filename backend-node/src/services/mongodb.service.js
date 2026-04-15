/**
 * @file mongodb.service.js
 * @description MongoDB CRUD & Aggregation Service for Smart Career Advisor
 *              Centralised service layer for all Mongoose model operations.
 *              Covers: Users, Assessments, Questions, Skills, Careers, Attempts.
 * @author Smart Career Advisor Team
 * @created 2026-03-28
 *
 * Usage:
 *   const mongoService = require('./mongodb.service');
 *   const users = await mongoService.users.getAll();
 */

'use strict';

const mongoose = require('mongoose');
const {
    User,
    Assessment,
    Question,
    Skill,
    Career,
    Attempt,
    UserSkill
} = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Build a case-insensitive regex for search fields.
 * @param {string} term
 * @returns {RegExp}
 */
function searchRegex(term) {
    return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// ─────────────────────────────────────────────────────────────────────────────
// ██╗   ██╗███████╗███████╗██████╗     ███████╗███████╗██████╗ ██╗   ██╗██╗ ██████╗███████╗
// USER CRUD
// ─────────────────────────────────────────────────────────────────────────────
const users = {

    /**
     * CREATE — Register a new user
     * @param {Object} data - { username, email, password_hash, profile }
     * @returns {Promise<Object>} Created user (without password)
     */
    async create(data) {
        const user = new User(data);
        await user.save();
        return user.toObject({ virtuals: true, versionKey: false });
    },

    /**
     * READ — Get all users (admin use, paginated)
     * @param {number} page    - 1-based page number
     * @param {number} limit   - Records per page
     * @param {string} search  - Optional search by username/email
     * @returns {Promise<{ users: Array, total: number, page: number, pages: number }>}
     */
    async getAll(page = 1, limit = 20, search = '') {
        const query = search
            ? { $or: [{ username: searchRegex(search) }, { email: searchRegex(search) }] }
            : {};

        const [items, total] = await Promise.all([
            User.find(query)
                .select('-password_hash')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return { users: items, total, page, pages: Math.ceil(total / limit) };
    },

    /**
     * READ — Get one user by MongoDB _id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        if (!isValidId(id)) return null;
        return User.findById(id).select('-password_hash').lean();
    },

    /**
     * READ — Find user by email (for auth)
     * @param {string} email
     * @returns {Promise<Object|null>} Full document including password_hash
     */
    async findByEmail(email) {
        return User.findOne({ email: email.toLowerCase().trim() });
    },

    /**
     * UPDATE — Patch user profile fields
     * @param {string} id   - MongoDB user _id
     * @param {Object} data - Fields to update (email, profile, etc.)
     * @returns {Promise<Object|null>} Updated user
     */
    async update(id, data) {
        if (!isValidId(id)) return null;
        // Never allow password update through this method
        delete data.password_hash;
        return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
                   .select('-password_hash')
                   .lean();
    },

    /**
     * DELETE — Soft-delete or hard-delete a user
     * @param {string} id
     * @param {boolean} soft - If true mark as inactive; if false remove
     * @returns {Promise<{ deleted: boolean, userId: string }>}
     */
    async delete(id, soft = true) {
        if (!isValidId(id)) return { deleted: false, userId: id };
        if (soft) {
            await User.findByIdAndUpdate(id, { 'profile.is_active': false });
        } else {
            await User.findByIdAndDelete(id);
        }
        return { deleted: true, userId: id };
    },

    /**
     * AGGREGATION — User profile with full skill portfolio
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async getProfileWithSkills(userId) {
        if (!isValidId(userId)) return null;
        const result = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'userskills',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'skill_records'
                }
            },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_records.skill_id',
                    foreignField: '_id',
                    as: 'skills'
                }
            },
            {
                $project: {
                    password_hash: 0,
                    __v: 0,
                    'skill_records.__v': 0
                }
            }
        ]);
        return result[0] || null;
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT CRUD
// ─────────────────────────────────────────────────────────────────────────────
const assessments = {

    /**
     * CREATE — Add a new assessment
     * @param {Object} data - { title, description, skill_ids, question_count, time_limit, difficulty }
     * @returns {Promise<Object>}
     */
    async create(data) {
        const assessment = new Assessment(data);
        await assessment.save();
        return assessment.toObject();
    },

    /**
     * READ — List all assessments with optional filters
     * @param {Object} filters - { difficulty, search }
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{ assessments: Array, total: number }>}
     */
    async getAll(filters = {}, page = 1, limit = 20) {
        const query = {};
        if (filters.difficulty)  query.difficulty  = filters.difficulty;
        if (filters.search)      query.title        = searchRegex(filters.search);

        const [items, total] = await Promise.all([
            Assessment.find(query)
                      .populate('skill_ids', 'skill_name category')
                      .sort({ createdAt: -1 })
                      .skip((page - 1) * limit)
                      .limit(limit)
                      .lean(),
            Assessment.countDocuments(query)
        ]);

        return { assessments: items, total, page, pages: Math.ceil(total / limit) };
    },

    /**
     * READ — Get one assessment with its questions populated
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getByIdWithQuestions(id) {
        if (!isValidId(id)) return null;
        const assessment = await Assessment.findById(id)
            .populate('skill_ids', 'skill_name category')
            .lean();
        if (!assessment) return null;

        const questions = await Question.find({ skill_id: { $in: assessment.skill_ids.map(s => s._id) } })
            .select('-correct_answer -explanation')   // hide answers during assessment
            .limit(assessment.question_count)
            .lean();

        return { ...assessment, questions };
    },

    /**
     * UPDATE — Modify assessment metadata
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        if (!isValidId(id)) return null;
        return Assessment.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
                         .populate('skill_ids', 'skill_name category')
                         .lean();
    },

    /**
     * DELETE — Remove an assessment and its related questions
     * @param {string} id
     * @returns {Promise<{ deleted: boolean }>}
     */
    async delete(id) {
        if (!isValidId(id)) return { deleted: false };
        await Assessment.findByIdAndDelete(id);
        return { deleted: true, assessmentId: id };
    },

    /**
     * AGGREGATION — Stats: average score, total attempts per assessment
     * @returns {Promise<Array>}
     */
    async getStats() {
        return Assessment.aggregate([
            {
                $lookup: {
                    from: 'attempts',
                    localField: '_id',
                    foreignField: 'assessment_id',
                    as: 'attempts'
                }
            },
            {
                $addFields: {
                    total_attempts:    { $size: '$attempts' },
                    avg_score:         { $avg: '$attempts.score' },
                    pass_count:        {
                        $size: {
                            $filter: {
                                input: '$attempts',
                                as: 'a',
                                cond: { $gte: ['$$a.score', 60] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    pass_rate: {
                        $cond: [
                            { $gt: ['$total_attempts', 0] },
                            { $multiply: [{ $divide: ['$pass_count', '$total_attempts'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    title: 1, difficulty: 1, question_count: 1,
                    total_attempts: 1,
                    avg_score:   { $round: ['$avg_score', 2] },
                    pass_rate:   { $round: ['$pass_rate', 2] }
                }
            },
            { $sort: { total_attempts: -1 } }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// QUESTION CRUD
// ─────────────────────────────────────────────────────────────────────────────
const questions = {

    /**
     * CREATE — Add a new question
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const q = new Question(data);
        await q.save();
        return q.toObject();
    },

    /**
     * READ — Get questions by skill with difficulty filter
     * @param {string} skillId
     * @param {string} difficulty
     * @returns {Promise<Array>}
     */
    async getBySkill(skillId, difficulty = null) {
        if (!isValidId(skillId)) return [];
        const query = { skill_id: skillId };
        if (difficulty) query.difficulty = difficulty;
        return Question.find(query).lean();
    },

    /**
     * UPDATE — Edit question content / options
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        if (!isValidId(id)) return null;
        return Question.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    },

    /**
     * DELETE — Remove a question
     * @param {string} id
     * @returns {Promise<{ deleted: boolean }>}
     */
    async delete(id) {
        if (!isValidId(id)) return { deleted: false };
        await Question.findByIdAndDelete(id);
        return { deleted: true, questionId: id };
    },

    /**
     * AGGREGATION — Count questions grouped by skill and difficulty
     * @returns {Promise<Array>}
     */
    async getCountBySkillAndDifficulty() {
        return Question.aggregate([
            {
                $group: {
                    _id: { skill_id: '$skill_id', difficulty: '$difficulty' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'skills',
                    localField: '_id.skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: { path: '$skill', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    skill_name: '$skill.skill_name',
                    difficulty: '$_id.difficulty',
                    question_count: '$count'
                }
            },
            { $sort: { skill_name: 1, difficulty: 1 } }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// SKILL CRUD
// ─────────────────────────────────────────────────────────────────────────────
const skills = {

    /**
     * CREATE — Add a new skill
     * @param {Object} data - { skill_name, category, description }
     * @returns {Promise<Object>}
     */
    async create(data) {
        const skill = new Skill(data);
        await skill.save();
        return skill.toObject();
    },

    /**
     * READ — Get all skills, optionally filtered by category
     * @param {string} category
     * @returns {Promise<Array>}
     */
    async getAll(category = null) {
        const query = category ? { category } : {};
        return Skill.find(query).sort({ skill_name: 1 }).lean();
    },

    /**
     * READ — Get one skill by id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        if (!isValidId(id)) return null;
        return Skill.findById(id).lean();
    },

    /**
     * UPDATE — Modify skill fields
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        if (!isValidId(id)) return null;
        return Skill.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    },

    /**
     * DELETE — Remove a skill (also removes related UserSkill records)
     * @param {string} id
     * @returns {Promise<{ deleted: boolean }>}
     */
    async delete(id) {
        if (!isValidId(id)) return { deleted: false };
        await Promise.all([
            Skill.findByIdAndDelete(id),
            UserSkill.deleteMany({ skill_id: id })
        ]);
        return { deleted: true, skillId: id };
    },

    /**
     * AGGREGATION — Skill proficiency breakdown for a user
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getUserSkillProfile(userId) {
        if (!isValidId(userId)) return [];
        return UserSkill.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'skill_id',
                    foreignField: '_id',
                    as: 'skill'
                }
            },
            { $unwind: '$skill' },
            {
                $project: {
                    _id: 0,
                    skill_name:         '$skill.skill_name',
                    category:           '$skill.category',
                    proficiency_level:   1,
                    score:               1,
                    attempts_count:      1,
                    last_assessed:       1
                }
            },
            { $sort: { score: -1 } }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// CAREER CRUD
// ─────────────────────────────────────────────────────────────────────────────
const careers = {

    /**
     * CREATE — Add a career path
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {
        const career = new Career(data);
        await career.save();
        return career.toObject();
    },

    /**
     * READ — List all careers
     * @param {string} industry - Optional filter
     * @returns {Promise<Array>}
     */
    async getAll(industry = null) {
        const query = industry ? { industry } : {};
        return Career.find(query).sort({ title: 1 }).lean();
    },

    /**
     * READ — Get one career by id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        if (!isValidId(id)) return null;
        return Career.findById(id).lean();
    },

    /**
     * UPDATE — Edit career details
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object|null>}
     */
    async update(id, data) {
        if (!isValidId(id)) return null;
        return Career.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    },

    /**
     * DELETE — Remove a career
     * @param {string} id
     * @returns {Promise<{ deleted: boolean }>}
     */
    async delete(id) {
        if (!isValidId(id)) return { deleted: false };
        await Career.findByIdAndDelete(id);
        return { deleted: true, careerId: id };
    },

    /**
     * AGGREGATION — Match careers to a user's assessed skill set
     * Returns careers ranked by how many required skills the user has
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getCareerMatches(userId) {
        if (!isValidId(userId)) return [];

        // Get user's assessed skills
        const userSkills = await UserSkill.find({
            user_id: userId,
            proficiency_level: { $in: ['intermediate', 'advanced', 'expert'] }
        }).select('skill_id').lean();

        const userSkillIds = userSkills.map(s => s.skill_id.toString());

        return Career.aggregate([
            {
                $addFields: {
                    matched_skill_count: {
                        $size: {
                            $filter: {
                                input: '$required_skills',
                                as: 'rs',
                                cond: {
                                    $in: [{ $toString: '$$rs.skill_id' }, userSkillIds]
                                }
                            }
                        }
                    },
                    total_required: { $size: '$required_skills' }
                }
            },
            {
                $addFields: {
                    match_percentage: {
                        $cond: [
                            { $gt: ['$total_required', 0] },
                            { $multiply: [{ $divide: ['$matched_skill_count', '$total_required'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $match: { matched_skill_count: { $gt: 0 } } },
            { $sort: { match_percentage: -1, title: 1 } },
            {
                $project: {
                    title: 1, description: 1, industry: 1,
                    avg_salary: 1, growth_outlook: 1,
                    matched_skill_count: 1, total_required: 1,
                    match_percentage: { $round: ['$match_percentage', 1] }
                }
            }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPT CRUD (Assessment Results)
// ─────────────────────────────────────────────────────────────────────────────
const attempts = {

    /**
     * CREATE — Save a completed assessment attempt
     * @param {Object} data - { user_id, assessment_id, score, answers, time_taken }
     * @returns {Promise<Object>}
     */
    async save(data) {
        const attempt = new Attempt({
            ...data,
            completed_at: new Date()
        });
        await attempt.save();
        return attempt.toObject();
    },

    /**
     * READ — Get one attempt with full details
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        if (!isValidId(id)) return null;
        return Attempt.findById(id)
            .populate('assessment_id', 'title difficulty')
            .lean();
    },

    /**
     * READ — Get all attempts for a user (history)
     * @param {string} userId
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getUserHistory(userId, limit = 10) {
        if (!isValidId(userId)) return [];
        return Attempt.find({ user_id: userId })
            .populate('assessment_id', 'title difficulty')
            .sort({ completed_at: -1 })
            .limit(limit)
            .lean();
    },

    /**
     * DELETE — Remove an attempt record
     * @param {string} id
     * @returns {Promise<{ deleted: boolean }>}
     */
    async delete(id) {
        if (!isValidId(id)) return { deleted: false };
        await Attempt.findByIdAndDelete(id);
        return { deleted: true, attemptId: id };
    },

    /**
     * AGGREGATION — Performance trends for a user over time
     * Groups attempts by month and calculates avg score per month
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getUserPerformanceTrend(userId) {
        if (!isValidId(userId)) return [];
        return Attempt.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: {
                        year:  { $year:  '$completed_at' },
                        month: { $month: '$completed_at' }
                    },
                    avg_score:       { $avg: '$score' },
                    total_attempts:  { $sum: 1 },
                    pass_count: {
                        $sum: { $cond: [{ $gte: ['$score', 60] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    period: {
                        $concat: [
                            { $toString: '$_id.year' }, '-',
                            { $toString: '$_id.month' }
                        ]
                    },
                    avg_score: { $round: ['$avg_score', 2] }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: { _id: 0, period: 1, avg_score: 1, total_attempts: 1, pass_count: 1 } }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM-WIDE AGGREGATIONS
// ─────────────────────────────────────────────────────────────────────────────
const analytics = {

    /**
     * Platform overview stats — total users, assessments, avg scores
     * @returns {Promise<Object>}
     */
    async getPlatformOverview() {
        const [totalUsers, totalAssessments, totalAttempts, avgScore] = await Promise.all([
            User.countDocuments({}),
            Assessment.countDocuments({}),
            Attempt.countDocuments({}),
            Attempt.aggregate([
                { $group: { _id: null, avg: { $avg: '$score' } } }
            ]).then(r => r[0]?.avg?.toFixed(2) || 0)
        ]);

        return { totalUsers, totalAssessments, totalAttempts, avgScore };
    },

    /**
     * Top performing users — ranked by average attempt score
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getTopPerformers(limit = 10) {
        return Attempt.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    avg_score:    { $avg: '$score' },
                    total_taken:  { $sum: 1 }
                }
            },
            { $match: { total_taken: { $gte: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    username:    '$user.username',
                    avg_score:   { $round: ['$avg_score', 2] },
                    total_taken: 1
                }
            },
            { $sort: { avg_score: -1, total_taken: -1 } },
            { $limit: limit }
        ]);
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    users,
    assessments,
    questions,
    skills,
    careers,
    attempts,
    analytics,
    // expose helper for use in other modules
    isValidId,
    searchRegex
};
