/**
 * Quick script to create a test user
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createTestUser() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_career_db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ email: 'test@example.com' });
        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log('\n📝 LOGIN CREDENTIALS:');
            console.log('   Email: test@example.com');
            console.log('   Password: test123');
            await mongoose.connection.close();
            return;
        }
3
        // Create new test user
        const testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'test123',
            profile: {
                full_name: 'Test User',
                phone: '1234567890'
            }
        });

        await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log('\n📝 LOGIN CREDENTIALS:');
        console.log('   Email: test@example.com');
        console.log('   Password: test123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

createTestUser();
