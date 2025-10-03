const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Expense = require('../src/models/Expense');
const Settlement = require('../src/models/Settlement');

const clearSpecificCollections = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Define collections to clear (you can modify this list)
    const collectionsTolear = [
      { model: User, name: 'users' },
      { model: Group, name: 'groups' },
      { model: Expense, name: 'expenses' },
      { model: Settlement, name: 'settlements' }
    ];

    let totalDeleted = 0;

    console.log(`\n🧹 Clearing ${collectionsTolear.length} specific collections...\n`);

    // Clear each specified collection
    for (const { model, name } of collectionsTolear) {
      try {
        const result = await model.deleteMany({});
        console.log(`✅ ${name}: Deleted ${result.deletedCount} documents`);
        totalDeleted += result.deletedCount;
      } catch (error) {
        console.error(`❌ Error clearing ${name}:`, error.message);
      }
    }

    console.log(`\n🎉 Specific collections cleared successfully!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    
    // Verify collections are empty
    console.log('\n🔍 Verification - Document counts after clearing:');
    for (const { model, name } of collectionsTolear) {
      try {
        const count = await model.countDocuments();
        console.log(`   ${name}: ${count} documents`);
      } catch (error) {
        console.log(`   ${name}: Error counting - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error clearing collections:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run immediately (no confirmation for specific collections)
console.log('🚀 Clearing specific collections: users, groups, expenses, settlements\n');
clearSpecificCollections();