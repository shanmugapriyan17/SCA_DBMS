/**
 * @file Skill.js
 * @description Skill model schema for MongoDB
 * @author SkillPath Team
 * @created 2026-01-14
 */

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    skill_name: {
        type: String,
        required: [true, 'Skill name is required'],
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Programming', 'Database', 'Web Development', 'Data Science', 'Cloud', 'DevOps', 'Soft Skills']
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: '📚'  // Default emoji icon
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
