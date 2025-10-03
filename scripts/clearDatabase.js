const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Expense = require('../src/models/Expense');
const Settlement = require('../src/models/Settlement');

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    let totalDeleted = 0;

    // Clear each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n🧹 Clearing collection: ${collectionName}`);
      
      try {
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`   ✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
        totalDeleted += result.deletedCount;
      } catch (error) {
        console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
      }
    }

    console.log(`\n🎉 Database cleared successfully!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log(`📋 Collections preserved: ${collections.length}`);
    
    // Verify collections are empty
    console.log('\n🔍 Verification - Document counts after clearing:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will delete ALL data from your database!');
console.log('📝 Database:', process.env.MONGODB_URI ? 'Connected URI configured' : 'No URI found');
console.log('🏗️  Collections and indexes will be preserved.');

rl.question('\n❓ Are you sure you want to continue? Type "YES" to confirm: ', (answer) => {
  rl.close();
  
  if (answer.trim().toUpperCase() === 'YES') {
    console.log('\n🚀 Starting database clear operation...\n');
    clearDatabase();
  } else {
    console.log('\n✋ Operation cancelled. Database remains unchanged.');
    process.exit(0);
  }
});