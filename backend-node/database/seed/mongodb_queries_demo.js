
/**
 * MongoDB Query Demo for Project Review
 * Run these in MongoDB Compass > Aggregations or mongosh
 * Database: skill_career_db
 */

// ================================================================
// STEP 1 — SHOW ALL COLLECTIONS (run this first)
// ================================================================
// In mongosh:
// show collections
// Expected: assessments, attempts, careers, questions, skills, userskills, users


// ================================================================
// STEP 2 — BASIC CRUD: users collection
// ================================================================

// CREATE — Insert a user (MongoDB Compass: Documents tab → ADD DATA)
db.users.insertOne({
  username: "demo_student",
  email: "demo@smartcareer.com",
  password_hash: "hashed_password",
  profile: { full_name: "Demo Student", bio: "DBMS student" },
  is_active: true,
  createdAt: new Date()
});

// READ — Find all users
db.users.find({}).pretty();

// READ — Find a specific user by email
db.users.findOne({ email: "demo@smartcareer.com" });

// UPDATE — Update user profile
db.users.updateOne(
  { email: "demo@smartcareer.com" },
  { $set: { "profile.bio": "DBMS project reviewer", updatedAt: new Date() } }
);

// DELETE — Soft delete (set inactive)
db.users.updateOne(
  { email: "demo@smartcareer.com" },
  { $set: { is_active: false } }
);


// ================================================================
// STEP 3 — READ: assessments collection
// ================================================================

// Count all assessments
db.assessments.countDocuments();
// Expected: 24

// Group assessments by career role
db.assessments.aggregate([
  { $group: { _id: "$career_role", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);

// Find all Data Scientist assessments (3 difficulty levels)
db.assessments.find(
  { career_role: "Data Scientist" },
  { title: 1, difficulty: 1, question_count: 1, time_limit: 1 }
).sort({ difficulty: 1 });

// Find beginner assessments only
db.assessments.find({ difficulty: "beginner" }, { title: 1, career_role: 1 });


// ================================================================
// STEP 4 — READ: skills collection
// ================================================================

// All skills grouped by category
db.skills.aggregate([
  { $group: { _id: "$category", skills: { $push: "$skill_name" }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);


// ================================================================
// STEP 5 — AGGREGATION: Career Match Analysis (Advanced)
// ================================================================
// "Find which careers a user with Python and SQL skills can match"

db.careers.aggregate([
  {
    $project: {
      title: 1,
      avg_salary: 1,
      total_skills: { $size: "$required_skills" },
      required_skill_names: {
        $map: {
          input: "$required_skills",
          as: "rs",
          in: "$$rs.skill_name"
        }
      }
    }
  },
  { $sort: { title: 1 } }
]);


// ================================================================
// STEP 6 — AGGREGATION: Assessment Performance Analytics
// ================================================================

// Average score per assessment (from attempts)
db.attempts.aggregate([
  { $match: { status: "completed" } },
  {
    $group: {
      _id: "$assessment_id",
      avg_score: { $avg: "$percentage" },
      total_attempts: { $sum: 1 },
      highest_score: { $max: "$percentage" },
      pass_count: { $sum: { $cond: [{ $gte: ["$percentage", 60] }, 1, 0] } }
    }
  },
  {
    $lookup: {
      from: "assessments",
      localField: "_id",
      foreignField: "_id",
      as: "assessment"
    }
  },
  { $unwind: { path: "$assessment", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      assessment_title: "$assessment.title",
      career_role: "$assessment.career_role",
      difficulty: "$assessment.difficulty",
      avg_score: { $round: ["$avg_score", 1] },
      total_attempts: 1,
      highest_score: 1,
      pass_rate: {
        $round: [{ $multiply: [{ $divide: ["$pass_count", "$total_attempts"] }, 100] }, 1]
      }
    }
  },
  { $sort: { avg_score: -1 } }
]);


// ================================================================
// STEP 7 — AGGREGATION: User Skill Profile
// ================================================================

// Get a user's complete skill profile with scores
db.userskills.aggregate([
  {
    $lookup: {
      from: "skills",
      localField: "skill_id",
      foreignField: "_id",
      as: "skill"
    }
  },
  { $unwind: "$skill" },
  {
    $project: {
      skill_name: "$skill.skill_name",
      category: "$skill.category",
      icon: "$skill.icon",
      score: 1,
      level: 1,
      attempts_count: 1,
      last_assessed: 1
    }
  },
  { $sort: { score: -1 } }
]);


// ================================================================
// STEP 8 — AGGREGATION: Platform-Wide Statistics
// ================================================================

db.assessments.aggregate([
  {
    $facet: {
      total_assessments: [{ $count: "count" }],
      by_difficulty: [
        { $group: { _id: "$difficulty", count: { $sum: 1 } } }
      ],
      by_career: [
        { $group: { _id: "$career_role", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]
    }
  }
]);

// Total documents across all collections
db.assessments.estimatedDocumentCount();   // Expected: 24
db.questions.estimatedDocumentCount();     // Expected: 240
db.careers.estimatedDocumentCount();       // Expected: 8
db.skills.estimatedDocumentCount();        // Expected: 15
db.users.estimatedDocumentCount();         // varies


// ================================================================
// STEP 9 — AGGREGATION: Skill Gap for a Career
// ================================================================
// "Show required skills for Data Scientist and compare with user scores"

db.careers.aggregate([
  { $match: { title: "Data Scientist" } },
  { $unwind: "$required_skills" },
  {
    $lookup: {
      from: "skills",
      localField: "required_skills.skill_id",
      foreignField: "_id",
      as: "skill_detail"
    }
  },
  { $unwind: { path: "$skill_detail", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      skill_name: { $ifNull: ["$skill_detail.skill_name", "$required_skills.skill_name"] },
      required_level: "$required_skills.required_level",
      importance: "$required_skills.importance"
    }
  }
]);


// ================================================================
// HOW MONGODB CHANGES REFLECT ON FRONTEND
// ================================================================
// 1. User takes assessment → Attempt inserted to `attempts` collection
// 2. UserSkill updated in `userskills` collection (score, level)
// 3. Dashboard fetches /api/skills/user/me → reads from `userskills`
// 4. RadarChart and career match % update AUTOMATICALLY
// 5. Career recommendations recalculate based on new skill scores
//
// MongoDB → Backend API → React state → Frontend UI
// Every page fetch is a live query, NO caching.
