/**
 * @file seed-neo4j.js
 * @description Seeds the Neo4j graph database from existing MongoDB careers and skills.
 *              Run with: node database/seed/seed-neo4j.js
 *
 * Graph schema created:
 *   (:Skill { id, name, category })
 *   (:Career { id, title, industry })
 *   (:Skill)-[:REQUIRED_FOR { level, importance }]->(:Career)
 *   (:Career)-[:SIMILAR_TO { reason }]->(:Career)
 *   (:Skill)-[:PREREQUISITE_OF]->(:Skill)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const neo4j    = require('neo4j-driver');

// ── MongoDB models (inline to avoid import issues) ──────────────────────────
const SkillSchema = new mongoose.Schema({
    skill_name: String, icon: String, category: String
});
const CareerSchema = new mongoose.Schema({
    title: String, industry: String, avg_salary: String,
    required_skills: [{
        skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        required_level: Number,
        importance: String
    }]
});
const Skill  = mongoose.model('Skill',  SkillSchema);
const Career = mongoose.model('Career', CareerSchema);

// ── Skill prerequisites (manual mapping) ────────────────────────────────────
const PREREQUISITES = [
    { from: 'Machine Learning', to: 'Python' },
    { from: 'Machine Learning', to: 'Statistics' },
    { from: 'Deep Learning',    to: 'Machine Learning' },
    { from: 'Data Analysis',    to: 'Python' },
    { from: 'Data Analysis',    to: 'SQL' },
    { from: 'React',            to: 'JavaScript' },
    { from: 'Node.js',          to: 'JavaScript' },
    { from: 'Docker',           to: 'Linux' },
    { from: 'Kubernetes',       to: 'Docker' },
    { from: 'TensorFlow',       to: 'Machine Learning' },
    { from: 'SQL',              to: 'Database Design' },
];

// ── Similar career pairs ──────────────────────────────────────────────────
const SIMILAR_PAIRS = [
    { a: 'Data Scientist',       b: 'ML Engineer',          reason: 'Both require ML and Python' },
    { a: 'Data Scientist',       b: 'Data Analyst',         reason: 'Both require data and statistics' },
    { a: 'Full Stack Developer', b: 'Frontend Developer',   reason: 'Both use JavaScript and React' },
    { a: 'Full Stack Developer', b: 'Backend Developer',    reason: 'Both use Node.js and databases' },
    { a: 'DevOps Engineer',      b: 'Backend Developer',    reason: 'Both involve server infrastructure' },
    { a: 'ML Engineer',          b: 'Data Scientist',       reason: 'Both require ML skills' },
    { a: 'Database Administrator', b: 'Data Analyst',       reason: 'Both require SQL expertise' },
];

// ── Run ───────────────────────────────────────────────────────────────────────
async function seedNeo4j() {
    console.log('🌱 Starting Neo4j seed...\n');

    // ── Connect MongoDB ──
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_career_db');
    console.log('✅ MongoDB connected');

    // ── Connect Neo4j ──
    const driver = neo4j.driver(
        process.env.NEO4J_URI      || 'neo4j://localhost:7687',
        neo4j.auth.basic(
            process.env.NEO4J_USER     || 'neo4j',
            process.env.NEO4J_PASSWORD || 'password'
        ),
        { disableLosslessIntegers: true }
    );
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connected\n');

    const session = driver.session();

    try {
        // ── 1. Clear existing graph ──────────────────────────────────────
        console.log('🧹 Clearing existing Neo4j data...');
        await session.run('MATCH (n) DETACH DELETE n');
        console.log('   Done.\n');

        // ── 2. Load all skills from MongoDB ──────────────────────────────
        const skills = await Skill.find({});
        console.log(`📚 Seeding ${skills.length} Skill nodes...`);

        for (const skill of skills) {
            await session.run(
                `MERGE (s:Skill { id: $id })
                 SET s.name     = $name,
                     s.category = $category,
                     s.icon     = $icon`,
                {
                    id:       skill._id.toString(),
                    name:     skill.skill_name,
                    category: skill.category || 'General',
                    icon:     skill.icon || '📚'
                }
            );
        }
        console.log(`   ✅ ${skills.length} Skill nodes created.\n`);

        // ── 3. Load all careers and create Career nodes + REQUIRED_FOR ───
        const careers = await Career.find().populate('required_skills.skill_id');
        console.log(`💼 Seeding ${careers.length} Career nodes + REQUIRED_FOR relationships...`);

        for (const career of careers) {
            // Create Career node
            await session.run(
                `MERGE (c:Career { id: $id })
                 SET c.title    = $title,
                     c.industry = $industry,
                     c.salary   = $salary`,
                {
                    id:       career._id.toString(),
                    title:    career.title,
                    industry: career.industry || 'Technology',
                    salary:   career.avg_salary || 'N/A'
                }
            );

            // Create REQUIRED_FOR relationships
            for (const rs of career.required_skills) {
                if (!rs.skill_id) continue;
                await session.run(
                    `MATCH (s:Skill { id: $skillId })
                     MATCH (c:Career { id: $careerId })
                     MERGE (s)-[r:REQUIRED_FOR]->(c)
                     SET r.level      = $level,
                         r.importance = $importance`,
                    {
                        skillId:    rs.skill_id._id.toString(),
                        careerId:   career._id.toString(),
                        level:      rs.required_level || 60,
                        importance: rs.importance || 'nice_to_have'
                    }
                );
            }
        }
        console.log(`   ✅ ${careers.length} Career nodes + REQUIRED_FOR edges created.\n`);

        // ── 4. Create SIMILAR_TO relationships ───────────────────────────
        console.log(`🔗 Creating SIMILAR_TO relationships...`);
        let simCount = 0;
        for (const pair of SIMILAR_PAIRS) {
            const result = await session.run(
                `MATCH (a:Career { title: $a })
                 MATCH (b:Career { title: $b })
                 MERGE (a)-[r:SIMILAR_TO]->(b)
                 SET r.reason = $reason
                 MERGE (b)-[r2:SIMILAR_TO]->(a)
                 SET r2.reason = $reason
                 RETURN a.title, b.title`,
                { a: pair.a, b: pair.b, reason: pair.reason }
            );
            if (result.records.length > 0) simCount++;
        }
        console.log(`   ✅ ${simCount} SIMILAR_TO pairs created.\n`);

        // ── 5. Create PREREQUISITE_OF relationships ──────────────────────
        console.log(`🎓 Creating PREREQUISITE_OF relationships...`);
        let preqCount = 0;
        for (const prereq of PREREQUISITES) {
            const result = await session.run(
                `MATCH (a:Skill { name: $from })
                 MATCH (b:Skill { name: $to })
                 MERGE (a)-[:PREREQUISITE_OF]->(b)
                 RETURN a.name, b.name`,
                { from: prereq.from, to: prereq.to }
            );
            if (result.records.length > 0) preqCount++;
        }
        console.log(`   ✅ ${preqCount} PREREQUISITE_OF edges created.\n`);

        // ── Summary ──────────────────────────────────────────────────────
        const countResult = await session.run(`
            MATCH (n) RETURN labels(n)[0] AS label, COUNT(n) AS count
        `);
        console.log('📊 Neo4j Graph Summary:');
        countResult.records.forEach(r => {
            console.log(`   ${r.get('label')}: ${r.get('count')} nodes`);
        });

        const relResult = await session.run(`
            MATCH ()-[r]->() RETURN type(r) AS type, COUNT(r) AS count
        `);
        relResult.records.forEach(r => {
            console.log(`   [${r.get('type')}]: ${r.get('count')} relationships`);
        });

        console.log('\n✅ Neo4j seed complete! Career recommendations will now use graph traversal.');

    } finally {
        await session.close();
        await driver.close();
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedNeo4j().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
