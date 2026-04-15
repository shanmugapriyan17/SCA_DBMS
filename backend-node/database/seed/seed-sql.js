/**
 * @file seed-sql.js
 * @description Seed script for MySQL analytics database
 * @author SkillPath Team
 * @created 2026-01-29
 * 
 * Usage: node database/seed/seed-sql.js
 */

require('dotenv').config();
const { connectMySQL, query, closeMySQL } = require('../../src/config/mysql');

/**
 * Sample data for seeding
 */
const loginHistoryData = [
    { user_id: 'user_001', username: 'john_doe', ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0 Chrome/120', success: true },
    { user_id: 'user_002', username: 'jane_smith', ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 Firefox/121', success: true },
    { user_id: 'user_003', username: 'bob_wilson', ip_address: '192.168.1.102', user_agent: 'Mozilla/5.0 Safari/17', success: true },
    { user_id: 'user_001', username: 'john_doe', ip_address: '10.0.0.50', user_agent: 'Mozilla/5.0 Chrome/120', success: true },
    { user_id: 'user_004', username: 'alice_johnson', ip_address: '192.168.1.103', user_agent: 'Mozilla/5.0 Edge/120', success: false, failure_reason: 'Invalid password' },
    { user_id: 'user_002', username: 'jane_smith', ip_address: '192.168.1.101', user_agent: 'Mozilla/5.0 Firefox/121', success: true },
];

const assessmentAnalyticsData = [
    { assessment_id: 'assess_001', assessment_title: 'Python Fundamentals', skill_name: 'Python', difficulty: 'beginner', total_attempts: 150, total_completions: 142, avg_score: 78.50, highest_score: 100.00, lowest_score: 35.00, pass_rate: 85.20, avg_time_seconds: 480 },
    { assessment_id: 'assess_002', assessment_title: 'JavaScript Essentials', skill_name: 'JavaScript', difficulty: 'intermediate', total_attempts: 120, total_completions: 108, avg_score: 72.30, highest_score: 98.00, lowest_score: 28.00, pass_rate: 78.50, avg_time_seconds: 520 },
    { assessment_id: 'assess_003', assessment_title: 'SQL Proficiency', skill_name: 'SQL', difficulty: 'beginner', total_attempts: 95, total_completions: 89, avg_score: 81.20, highest_score: 100.00, lowest_score: 45.00, pass_rate: 88.40, avg_time_seconds: 420 },
    { assessment_id: 'assess_004', assessment_title: 'React Developer', skill_name: 'React', difficulty: 'intermediate', total_attempts: 80, total_completions: 72, avg_score: 68.90, highest_score: 95.00, lowest_score: 22.00, pass_rate: 72.10, avg_time_seconds: 580 },
    { assessment_id: 'assess_005', assessment_title: 'Machine Learning Basics', skill_name: 'Machine Learning', difficulty: 'advanced', total_attempts: 45, total_completions: 38, avg_score: 65.40, highest_score: 92.00, lowest_score: 30.00, pass_rate: 68.20, avg_time_seconds: 720 },
];

const platformStatsData = [
    { stat_date: '2026-01-23', total_users: 1250, new_users: 25, active_users: 180, assessments_taken: 95, assessments_completed: 88, avg_daily_score: 75.20, total_skills_assessed: 12, peak_hour: 14 },
    { stat_date: '2026-01-24', total_users: 1275, new_users: 30, active_users: 195, assessments_taken: 110, assessments_completed: 102, avg_daily_score: 77.80, total_skills_assessed: 15, peak_hour: 15 },
    { stat_date: '2026-01-25', total_users: 1305, new_users: 28, active_users: 165, assessments_taken: 78, assessments_completed: 72, avg_daily_score: 74.50, total_skills_assessed: 10, peak_hour: 11 },
    { stat_date: '2026-01-26', total_users: 1333, new_users: 22, active_users: 145, assessments_taken: 65, assessments_completed: 60, avg_daily_score: 76.30, total_skills_assessed: 8, peak_hour: 10 },
    { stat_date: '2026-01-27', total_users: 1355, new_users: 35, active_users: 210, assessments_taken: 125, assessments_completed: 118, avg_daily_score: 78.90, total_skills_assessed: 18, peak_hour: 16 },
    { stat_date: '2026-01-28', total_users: 1390, new_users: 40, active_users: 225, assessments_taken: 142, assessments_completed: 135, avg_daily_score: 79.50, total_skills_assessed: 20, peak_hour: 15 },
    { stat_date: '2026-01-29', total_users: 1430, new_users: 38, active_users: 198, assessments_taken: 98, assessments_completed: 92, avg_daily_score: 77.20, total_skills_assessed: 14, peak_hour: 14 },
];

const skillPopularityData = [
    { skill_id: 'skill_001', skill_name: 'Python', category: 'Programming', total_assessments: 450, unique_users: 320, avg_proficiency: 72.50, trend: 'up' },
    { skill_id: 'skill_002', skill_name: 'JavaScript', category: 'Programming', total_assessments: 380, unique_users: 290, avg_proficiency: 68.30, trend: 'up' },
    { skill_id: 'skill_003', skill_name: 'SQL', category: 'Database', total_assessments: 320, unique_users: 250, avg_proficiency: 75.80, trend: 'stable' },
    { skill_id: 'skill_004', skill_name: 'React', category: 'Frontend', total_assessments: 280, unique_users: 210, avg_proficiency: 65.20, trend: 'up' },
    { skill_id: 'skill_005', skill_name: 'Machine Learning', category: 'AI/ML', total_assessments: 180, unique_users: 140, avg_proficiency: 62.10, trend: 'up' },
    { skill_id: 'skill_006', skill_name: 'Node.js', category: 'Backend', total_assessments: 220, unique_users: 175, avg_proficiency: 69.40, trend: 'stable' },
    { skill_id: 'skill_007', skill_name: 'Docker', category: 'DevOps', total_assessments: 95, unique_users: 78, avg_proficiency: 58.90, trend: 'up' },
];

const userActivityData = [
    { user_id: 'user_001', total_logins: 45, total_assessments: 12, total_skills_learned: 5, avg_assessment_score: 82.30, account_created: '2025-10-15', engagement_score: 85 },
    { user_id: 'user_002', total_logins: 32, total_assessments: 8, total_skills_learned: 4, avg_assessment_score: 76.50, account_created: '2025-11-20', engagement_score: 72 },
    { user_id: 'user_003', total_logins: 18, total_assessments: 5, total_skills_learned: 3, avg_assessment_score: 71.20, account_created: '2025-12-05', engagement_score: 58 },
    { user_id: 'user_004', total_logins: 55, total_assessments: 15, total_skills_learned: 7, avg_assessment_score: 88.90, account_created: '2025-09-01', engagement_score: 92 },
    { user_id: 'user_005', total_logins: 8, total_assessments: 2, total_skills_learned: 1, avg_assessment_score: 65.00, account_created: '2026-01-10', engagement_score: 25 },
];

/**
 * Clear existing data
 */
async function clearData() {
    console.log('🗑️  Clearing existing MySQL data...');
    await query('DELETE FROM login_history');
    await query('DELETE FROM assessment_analytics');
    await query('DELETE FROM platform_stats');
    await query('DELETE FROM skill_popularity');
    await query('DELETE FROM user_activity_summary');
    console.log('   ✅ All tables cleared');
}

/**
 * Seed login history
 */
async function seedLoginHistory() {
    console.log('🔐 Seeding login history...');
    for (const login of loginHistoryData) {
        await query(
            `INSERT INTO login_history (user_id, username, ip_address, user_agent, success, failure_reason) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [login.user_id, login.username, login.ip_address, login.user_agent, login.success, login.failure_reason || null]
        );
    }
    console.log(`   ✅ ${loginHistoryData.length} login records created`);
}

/**
 * Seed assessment analytics
 */
async function seedAssessmentAnalytics() {
    console.log('📊 Seeding assessment analytics...');
    for (const assessment of assessmentAnalyticsData) {
        await query(
            `INSERT INTO assessment_analytics 
             (assessment_id, assessment_title, skill_name, difficulty, total_attempts, total_completions, avg_score, highest_score, lowest_score, pass_rate, avg_time_seconds) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [assessment.assessment_id, assessment.assessment_title, assessment.skill_name, assessment.difficulty,
            assessment.total_attempts, assessment.total_completions, assessment.avg_score, assessment.highest_score,
            assessment.lowest_score, assessment.pass_rate, assessment.avg_time_seconds]
        );
    }
    console.log(`   ✅ ${assessmentAnalyticsData.length} assessment analytics records created`);
}

/**
 * Seed platform stats
 */
async function seedPlatformStats() {
    console.log('📈 Seeding platform statistics...');
    for (const stat of platformStatsData) {
        await query(
            `INSERT INTO platform_stats 
             (stat_date, total_users, new_users, active_users, assessments_taken, assessments_completed, avg_daily_score, total_skills_assessed, peak_hour) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [stat.stat_date, stat.total_users, stat.new_users, stat.active_users, stat.assessments_taken,
            stat.assessments_completed, stat.avg_daily_score, stat.total_skills_assessed, stat.peak_hour]
        );
    }
    console.log(`   ✅ ${platformStatsData.length} platform stats records created`);
}

/**
 * Seed skill popularity
 */
async function seedSkillPopularity() {
    console.log('🌟 Seeding skill popularity...');
    for (const skill of skillPopularityData) {
        await query(
            `INSERT INTO skill_popularity 
             (skill_id, skill_name, category, total_assessments, unique_users, avg_proficiency, trend) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [skill.skill_id, skill.skill_name, skill.category, skill.total_assessments,
            skill.unique_users, skill.avg_proficiency, skill.trend]
        );
    }
    console.log(`   ✅ ${skillPopularityData.length} skill popularity records created`);
}

/**
 * Seed user activity summary
 */
async function seedUserActivity() {
    console.log('👤 Seeding user activity summary...');
    for (const user of userActivityData) {
        await query(
            `INSERT INTO user_activity_summary 
             (user_id, total_logins, total_assessments, total_skills_learned, avg_assessment_score, account_created, engagement_score) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.user_id, user.total_logins, user.total_assessments, user.total_skills_learned,
            user.avg_assessment_score, user.account_created, user.engagement_score]
        );
    }
    console.log(`   ✅ ${userActivityData.length} user activity records created`);
}

/**
 * Main seeding function
 */
async function seedMySQL() {
    try {
        // Connect to MySQL
        await connectMySQL();
        console.log('✅ Connected to MySQL\n');

        // Seed all tables
        await clearData();
        await seedLoginHistory();
        await seedAssessmentAnalytics();
        await seedPlatformStats();
        await seedSkillPopularity();
        await seedUserActivity();

        console.log('\n🎉 MySQL seeding completed successfully!');

    } catch (error) {
        console.error('❌ MySQL seeding failed:', error.message);
        process.exit(1);
    } finally {
        await closeMySQL();
    }
}

seedMySQL();
