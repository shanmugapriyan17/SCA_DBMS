/**
 * @file Assessment.js
 * @description Assessment (test) model schema for MongoDB
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Assessment title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    skill_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    }],
    // Career role this assessment belongs to (e.g. "Data Scientist")
    career_role: {
        type: String,
        trim: true,
        default: null
    },
    // Direct reference to Career document
    career_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Career',
        default: null
    },
    question_count: {
        type: Number,
        required: true,
        min: 5,
        max: 50,
        default: 10
    },
    time_limit: {
        type: Number,  // in minutes
        required: true,
        min: 5,
        max: 120,
        default: 15
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);
