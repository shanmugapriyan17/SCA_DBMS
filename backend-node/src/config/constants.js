/**
 * @file constants.js
 * @description Application constants and configuration values
 * @author SkillPath Team
 * @created 2026-01-14
 */

// Skill levels based on score
const SKILL_LEVELS = {
    BEGINNER: { min: 0, max: 40, label: 'Beginner' },
    INTERMEDIATE: { min: 41, max: 70, label: 'Intermediate' },
    ADVANCED: { min: 71, max: 90, label: 'Advanced' },
    EXPERT: { min: 91, max: 100, label: 'Expert' }
};

// Get skill level from score
function getSkillLevel(score) {
    if (score <= 40) return 'Beginner';
    if (score <= 70) return 'Intermediate';
    if (score <= 90) return 'Advanced';
    return 'Expert';
}

// Assessment status values
const ASSESSMENT_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
};

// Skill categories
const SKILL_CATEGORIES = [
    'Programming',
    'Database',
    'Web Development',
    'Data Science',
    'Cloud',
    'DevOps',
    'Soft Skills'
];

// JWT configuration
const JWT_CONFIG = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = {
    SKILL_LEVELS,
    getSkillLevel,
    ASSESSMENT_STATUS,
    SKILL_CATEGORIES,
    JWT_CONFIG
};
