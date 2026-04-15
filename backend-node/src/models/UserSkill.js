/**
 * @file UserSkill.js
 * @description User skill scores model - tracks skill proficiency per user
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');
const { getSkillLevel } = require('../config/constants');

const userSkillSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
    },
    attempts_count: {
        type: Number,
        default: 0
    },
    last_assessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound unique index (one score per user-skill pair)
userSkillSchema.index({ user_id: 1, skill_id: 1 }, { unique: true });

// Auto-set level based on score before save
userSkillSchema.pre('save', function (next) {
    this.level = getSkillLevel(this.score);
    next();
});

module.exports = mongoose.model('UserSkill', userSkillSchema);
