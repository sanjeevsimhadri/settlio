const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Group = require('./src/models/Group');
const Expense = require('./src/models/Expense');
const Settlement = require('./src/models/Settlement');

async function clearAllData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Validate environment
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('📍 Database URL:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('🗑️  Starting database cleanup...\n');

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const groupCount = await Group.countDocuments();
    const expenseCount = await Expense.countDocuments();
    const settlementCount = await Settlement.countDocuments();

    console.log('📊 Current data count:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏠 Groups: ${groupCount}`);
    console.log(`   💰 Expenses: ${expenseCount}`);
    console.log(`   🔄 Settlements: ${settlementCount}\n`);

    const totalCount = userCount + groupCount + expenseCount + settlementCount;
    if (totalCount === 0) {
      console.log('✨ Database is already clean - no data to delete!');
      return;
    }

    // Delete all data in proper order (dependencies first)
    console.log('🧹 Deleting all data...');
    
    // Delete settlements first (they may reference users/groups)
    const settlementResult = await Settlement.deleteMany({});
    console.log(`✅ Deleted ${settlementResult.deletedCount} settlements`);
    
    // Delete expenses next (they may reference users/groups)
    const expenseResult = await Expense.deleteMany({});
    console.log(`✅ Deleted ${expenseResult.deletedCount} expenses`);
    
    // Delete groups (they may reference users)
    const groupResult = await Group.deleteMany({});
    console.log(`✅ Deleted ${groupResult.deletedCount} groups`);
    
    // Delete users last
    const userResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    const totalDeleted = settlementResult.deletedCount + expenseResult.deletedCount + groupResult.deletedCount + userResult.deletedCount;

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📈 Summary:');
    console.log(`   🗑️  Total records deleted: ${totalDeleted}`);
    console.log(`   🔄 Settlements: ${settlementResult.deletedCount}`);
    console.log(`   💰 Expenses: ${expenseResult.deletedCount}`);
    console.log(`   🏠 Groups: ${groupResult.deletedCount}`);
    console.log(`   👥 Users: ${userResult.deletedCount}`);
    // Also clear any potential session data or other collections
    console.log('\n🧽 Checking for additional collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📋 Found collections: ${collectionNames.join(', ')}`);
    
    // Clear any additional collections that might exist (like sessions)
    const additionalCollections = collectionNames.filter(name => 
      !['users', 'groups', 'expenses', 'settlements'].includes(name) && 
      !name.startsWith('system.')
    );
    
    if (additionalCollections.length > 0) {
      console.log(`🧹 Clearing additional collections: ${additionalCollections.join(', ')}`);
      for (const collectionName of additionalCollections) {
        try {
          const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
          console.log(`✅ Cleared collection '${collectionName}': ${result.deletedCount} documents`);
        } catch (err) {
          console.log(`⚠️  Could not clear collection '${collectionName}': ${err.message}`);
        }
      }
    }

    console.log('\n✨ You can now start fresh with completely clean database!');
    console.log('🔄 All user accounts, groups, expenses, settlements, and related data have been removed.');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    console.error('🔍 Full error:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check your MONGO_URI in the .env file');
    console.log('   2. Ensure MongoDB is running and accessible');
    console.log('   3. Verify network connectivity to your database');
  } finally {
    // Close the connection
    try {
      await mongoose.connection.close();
      console.log('🔒 Database connection closed');
    } catch (closeError) {
      console.log('⚠️  Error closing connection:', closeError.message);
    }
    process.exit(0);
  }
}

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
    await clearAllData();
  } else {
    console.log('💡 To proceed with the cleanup, run this script with the --force flag:');
    console.log('   node clearDatabase.js --force');
    console.log('\n🛡️  This safety measure prevents accidental data loss.');
    console.log('🔍 Make sure you have backups if needed before proceeding.\n');
    process.exit(0);
  }
}

// Run the script
runWithConfirmation().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});