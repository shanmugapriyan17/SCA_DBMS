/**
 * @file seed.js
 * @description Database seeding script for MongoDB and Neo4j
 * @author SkillPath Team
 * @created 2026-01-14
 * 
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectNeo4j, runQuery, closeNeo4j } = require('../../src/config/neo4j');
const { Skill, Question, Assessment, Career } = require('../../src/models');

const skillsData = require('./skills.json');
const questionsData = require('./questions.json');
const careersData = require('./careers.json');

/**
 * Clear existing data
 */
async function clearData(neo4jAvailable) {
    console.log('🗑️  Clearing existing data...');
    await Skill.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await Career.deleteMany({});

    // Clear Neo4j
    if (neo4jAvailable) {
        await runQuery('MATCH (n) DETACH DELETE n');
    }
}

/**
 * Seed skills into MongoDB and Neo4j
 */
async function seedSkills(neo4jAvailable) {
    console.log('📚 Seeding skills...');
    const skills = await Skill.insertMany(skillsData);
    console.log(`   ✅ ${skills.length} skills created in MongoDB`);

    // Create skill nodes in Neo4j
    if (neo4jAvailable) {
        for (const skill of skills) {
            await runQuery(
                `CREATE (s:Skill {id: $id, name: $name, category: $category})`,
                { id: skill._id.toString(), name: skill.skill_name, category: skill.category }
            );
        }
        console.log(`   ✅ ${skills.length} skill nodes created in Neo4j`);
    } else {
        console.log('   ⚠️  Skipped Neo4j skill nodes (Neo4j not available)');
    }

    return skills;
}

/**
 * Seed questions into MongoDB
 */
async function seedQuestions(skills) {
    console.log('❓ Seeding questions...');

    const skillMap = {};
    skills.forEach(s => { skillMap[s.skill_name] = s._id; });

    const questions = [];
    for (const skillQuestions of questionsData) {
        const skillId = skillMap[skillQuestions.skill_name];
        if (!skillId) continue;

        for (const q of skillQuestions.questions) {
            questions.push({
                skill_id: skillId,
                content: q.content,
                options: q.options,
                correct_answer: q.correct_answer,
                difficulty: q.difficulty,
                explanation: q.explanation,
                question_type: 'mcq',
                max_marks: 1
            });
        }
    }

    await Question.insertMany(questions);
    console.log(`   ✅ ${questions.length} questions created`);
    return questions;
}

/**
 * Seed assessments into MongoDB
 */
async function seedAssessments(skills) {
    console.log('📝 Seeding assessments...');

    const assessments = [
        {
            title: 'Python Fundamentals',
            description: 'Test your Python basics including syntax, data types, and functions',
            skill_ids: [skills.find(s => s.skill_name === 'Python')._id],
            question_count: 5,
            time_limit: 10,
            difficulty: 'beginner'
        },
        {
            title: 'JavaScript Essentials',
            description: 'Assess your JavaScript knowledge from variables to promises',
            skill_ids: [skills.find(s => s.skill_name === 'JavaScript')._id],
            question_count: 5,
            time_limit: 10,
            difficulty: 'intermediate'
        },
        {
            title: 'SQL Proficiency',
            description: 'Test your database query skills with SQL questions',
            skill_ids: [skills.find(s => s.skill_name === 'SQL')._id],
            question_count: 5,
            time_limit: 10,
            difficulty: 'beginner'
        },
        {
            title: 'React Developer',
            description: 'Evaluate your React.js frontend development skills',
            skill_ids: [skills.find(s => s.skill_name === 'React')._id],
            question_count: 5,
            time_limit: 10,
            difficulty: 'intermediate'
        },
        {
            title: 'Machine Learning Basics',
            description: 'Test your understanding of ML concepts and algorithms',
            skill_ids: [skills.find(s => s.skill_name === 'Machine Learning')._id],
            question_count: 5,
            time_limit: 15,
            difficulty: 'advanced'
        }
    ];

    await Assessment.insertMany(assessments);
    console.log(`   ✅ ${assessments.length} assessments created`);
}

/**
 * Seed careers into MongoDB and Neo4j
 */
async function seedCareers(skills, neo4jAvailable) {
    console.log('🎯 Seeding careers...');

    const skillMap = {};
    skills.forEach(s => { skillMap[s.skill_name] = s._id; });

    const careers = [];
    for (const careerData of careersData) {
        const career = {
            title: careerData.title,
            description: careerData.description,
            industry: careerData.industry,
            required_skills: careerData.required_skills.map(rs => ({
                skill_id: skillMap[rs.skill_name],
                required_level: rs.required_level,
                importance: rs.importance
            })).filter(rs => rs.skill_id),
            avg_salary: careerData.avg_salary,
            growth_outlook: careerData.growth_outlook
        };
        careers.push(career);
    }

    const createdCareers = await Career.insertMany(careers);
    console.log(`   ✅ ${createdCareers.length} careers created in MongoDB`);

    // Create career nodes and relationships in Neo4j
    if (neo4jAvailable) {
        for (let i = 0; i < createdCareers.length; i++) {
            const career = createdCareers[i];
            const careerData = careersData[i];

            await runQuery(
                `CREATE (c:Career {id: $id, title: $title, industry: $industry})`,
                { id: career._id.toString(), title: career.title, industry: career.industry }
            );

            for (const reqSkill of careerData.required_skills) {
                const skillId = skillMap[reqSkill.skill_name];
                if (skillId) {
                    await runQuery(
                        `MATCH (s:Skill {id: $skillId}), (c:Career {id: $careerId})
             CREATE (s)-[:REQUIRED_FOR {level: $level, importance: $importance}]->(c)`,
                        {
                            skillId: skillId.toString(),
                            careerId: career._id.toString(),
                            level: reqSkill.required_level,
                            importance: reqSkill.importance
                        }
                    );
                }
            }
        }
        console.log(`   ✅ Career nodes and relationships created in Neo4j`);

        const progressions = [
            { from: 'Data Analyst', to: 'Data Scientist', years: 2 },
            { from: 'Frontend Developer', to: 'Full Stack Developer', years: 2 },
            { from: 'Backend Developer', to: 'Full Stack Developer', years: 2 },
            { from: 'Data Scientist', to: 'ML Engineer', years: 3 }
        ];

        for (const prog of progressions) {
            await runQuery(
                `MATCH (c1:Career {title: $from}), (c2:Career {title: $to})
         CREATE (c1)-[:LEADS_TO {years_experience: $years}]->(c2)`,
                prog
            );
        }
        console.log(`   ✅ Career progression paths created`);
    } else {
        console.log('   ⚠️  Skipped Neo4j career nodes (Neo4j not available)');
    }
}

/**
 * Main seeding function
 */
async function seed() {
    let neo4jAvailable = false;
    try {
        // Connect to databases
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_career_db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        try {
            await connectNeo4j();
            neo4jAvailable = true;
            console.log('✅ Connected to Neo4j');
        } catch (err) {
            console.log('⚠️  Neo4j not available - will seed MongoDB only');
        }

        // Seed data
        await clearData(neo4jAvailable);

        // Create default user
        const { User } = require('../../src/models');
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password_hash: 'password123', // Will be hashed by pre-save hook
            profile: { full_name: 'System Admin' }
        });
        await adminUser.save();
        console.log('👤 Default user created: admin@example.com / password123');

        const skills = await seedSkills(neo4jAvailable);
        await seedQuestions(skills);
        await seedAssessments(skills);
        await seedCareers(skills, neo4jAvailable);

        console.log('\n🎉 Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        await closeNeo4j();
        console.log('👋 Database connections closed');
    }
}

seed();
