/**
 * @file Attempt.js
 * @description Assessment attempt model - tracks user test sessions
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    user_answer: {
        type: String,
        enum: ['A', 'B', 'C', 'D', null],
        default: null
    },
    is_correct: {
        type: Boolean,
        default: false
    },
    marks_obtained: {
        type: Number,
        default: 0
    }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    assessment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: [true, 'Assessment reference is required']
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    finished_at: {
        type: Date
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    answers: [answerSchema],
    total_score: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual: duration in minutes
attemptSchema.virtual('duration').get(function () {
    if (!this.finished_at) return null;
    return Math.round((this.finished_at - this.started_at) / 60000);
});

module.exports = mongoose.model('Attempt', attemptSchema);
