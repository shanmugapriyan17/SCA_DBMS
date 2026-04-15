/**
 * @file Career.js
 * @description Career model schema for MongoDB
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema({
    skill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true
    },
    required_level: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    importance: {
        type: String,
        enum: ['must_have', 'nice_to_have'],
        default: 'must_have'
    }
}, { _id: false });

const careerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Career title is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        trim: true
    },
    required_skills: [requiredSkillSchema],
    avg_salary: {
        type: String,  // "₹8-15 LPA"
        trim: true
    },
    growth_outlook: {
        type: String,
        enum: ['High demand', 'Growing', 'Stable', 'Declining'],
        default: 'Stable'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Career', careerSchema);
