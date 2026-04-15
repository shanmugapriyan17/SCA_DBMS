/**
 * @file index.js
 * @description Exports all Mongoose models from a single entry point
 * @author SkillPath Team
 * @created 2026-01-14
 */

const User = require('./User');
const Skill = require('./Skill');
const Question = require('./Question');
const Assessment = require('./Assessment');
const Attempt = require('./Attempt');
const UserSkill = require('./UserSkill');
const Career = require('./Career');

module.exports = {
    User,
    Skill,
    Question,
    Assessment,
    Attempt,
    UserSkill,
    Career
};
