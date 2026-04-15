/**
 * @file Question.js
 * @description Question model schema for MongoDB (MCQ questions)
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    skill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: [true, 'Skill reference is required']
    },
    question_type: {
        type: String,
        enum: ['mcq'],
        default: 'mcq'
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1
    },
    content: {
        type: String,
        required: [true, 'Question content is required'],
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: (v) => v.length === 4,
            message: 'Questions must have exactly 4 options'
        }
    },
    correct_answer: {
        type: String,
        required: [true, 'Correct answer is required'],
        enum: ['A', 'B', 'C', 'D']
    },
    max_marks: {
        type: Number,
        default: 1
    },
    explanation: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
