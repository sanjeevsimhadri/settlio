const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import all models to ensure they're registered
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Expense = require('../src/models/Expense');
const Settlement = require('../src/models/Settlement');

const clearDatabase = async () => {
  try {
    // Validate environment variables
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Database URL:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get counts before deletion for each model
    console.log('📊 Current data count:');
    const userCount = await User.countDocuments();
    const groupCount = await Group.countDocuments();
    const expenseCount = await Expense.countDocuments();
    const settlementCount = await Settlement.countDocuments();

    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏠 Groups: ${groupCount}`);
    console.log(`   💰 Expenses: ${expenseCount}`);
    console.log(`   🔄 Settlements: ${settlementCount}`);

    const totalRecords = userCount + groupCount + expenseCount + settlementCount;
    console.log(`   📋 Total: ${totalRecords} records\n`);

    if (totalRecords === 0) {
      console.log('✨ Database is already clean - no data to delete!');
      return;
    }

    // Delete all data in proper order (dependencies first)
    console.log('🧹 Deleting all data in dependency order...');
    
    const settlementResult = await Settlement.deleteMany({});
    console.log(`✅ Deleted ${settlementResult.deletedCount} settlements`);
    
    const expenseResult = await Expense.deleteMany({});
    console.log(`✅ Deleted ${expenseResult.deletedCount} expenses`);
    
    const groupResult = await Group.deleteMany({});
    console.log(`✅ Deleted ${groupResult.deletedCount} groups`);
    
    const userResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    const totalDeleted = settlementResult.deletedCount + expenseResult.deletedCount + groupResult.deletedCount + userResult.deletedCount;

    // Also clear any additional collections
    console.log('\n🧽 Checking for additional collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📋 Found collections: ${collectionNames.join(', ')}`);
    
    const additionalCollections = collectionNames.filter(name => 
      !['users', 'groups', 'expenses', 'settlements'].includes(name) && 
      !name.startsWith('system.')
    );
    
    let additionalDeleted = 0;
    if (additionalCollections.length > 0) {
      console.log(`🧹 Clearing additional collections: ${additionalCollections.join(', ')}`);
      for (const collectionName of additionalCollections) {
        try {
          const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
          console.log(`✅ Cleared collection '${collectionName}': ${result.deletedCount} documents`);
          additionalDeleted += result.deletedCount;
        } catch (err) {
          console.log(`⚠️  Could not clear collection '${collectionName}': ${err.message}`);
        }
      }
    }

    console.log(`\n🎉 Database cleared successfully!`);
    console.log('📈 Summary:');
    console.log(`   �️  Main records deleted: ${totalDeleted}`);
    console.log(`   🔄 Settlements: ${settlementResult.deletedCount}`);
    console.log(`   💰 Expenses: ${expenseResult.deletedCount}`);
    console.log(`   🏠 Groups: ${groupResult.deletedCount}`);
    console.log(`   👥 Users: ${userResult.deletedCount}`);
    if (additionalDeleted > 0) {
      console.log(`   📋 Additional collections: ${additionalDeleted}`);
    }
    console.log(`   📊 Grand Total: ${totalDeleted + additionalDeleted} records deleted`);
    
    // Verify main models are empty
    console.log('\n🔍 Verification - Final document counts:');
    console.log(`   👥 Users: ${await User.countDocuments()}`);
    console.log(`   🏠 Groups: ${await Group.countDocuments()}`);
    console.log(`   💰 Expenses: ${await Expense.countDocuments()}`);
    console.log(`   🔄 Settlements: ${await Settlement.countDocuments()}`);
    
    console.log('\n✨ Database is now completely clean and ready for fresh data!');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    console.error('🔍 Full error:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your MONGO_URI or MONGODB_URI in the .env file');
    console.log('   2. Ensure MongoDB is running and accessible');
    console.log('   3. Verify network connectivity to your database');
  } finally {
    // Close connection
    try {
      await mongoose.connection.close();
      console.log('\n� Database connection closed');
    } catch (closeError) {
      console.log('⚠️  Error closing connection:', closeError.message);
    }
    process.exit(0);
  }
};

// Enhanced confirmation and execution
async function runWithConfirmation() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('📋 This includes:');
  console.log('   - All user accounts and authentication data');
  console.log('   - All groups and memberships');
  console.log('   - All expenses and expense records');
  console.log('   - All settlements and payment records');
  console.log('   - All related data and relationships');
  console.log('   - Any session data or cached information\n');

  // Check if running with --force flag
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force') || args.includes('-f');

  if (forceFlag) {
    console.log('🚀 Force flag detected, proceeding with cleanup...\n');
    await clearDatabase();
  } else {
    // Interactive confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('📝 Database:', mongoUri ? 'URI configured ✅' : 'No URI found ❌');
    console.log('🏗️  Collections and indexes will be preserved.');

    rl.question('\n❓ Are you sure you want to continue? Type "YES" to confirm: ', (answer) => {
      rl.close();
      
      if (answer.trim().toUpperCase() === 'YES') {
        console.log('\n🚀 Starting database clear operation...\n');
        clearDatabase();
      } else {
        console.log('\n✋ Operation cancelled. Database remains unchanged.');
        console.log('💡 Tip: You can also run with --force flag to skip confirmation.');
        process.exit(0);
      }
    });
  }
}

// Run the script
runWithConfirmation().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});