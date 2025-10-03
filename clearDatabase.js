const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Group = require('./src/models/Group');
const Expense = require('./src/models/Expense');

async function clearAllData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
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

    console.log('📊 Current data count:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏠 Groups: ${groupCount}`);
    console.log(`   💰 Expenses: ${expenseCount}\n`);

    if (userCount === 0 && groupCount === 0 && expenseCount === 0) {
      console.log('✨ Database is already clean - no data to delete!');
      return;
    }

    // Delete all data
    console.log('🧹 Deleting all data...');
    
    const expenseResult = await Expense.deleteMany({});
    console.log(`✅ Deleted ${expenseResult.deletedCount} expenses`);
    
    const groupResult = await Group.deleteMany({});
    console.log(`✅ Deleted ${groupResult.deletedCount} groups`);
    
    const userResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📈 Summary:');
    console.log(`   🗑️  Total records deleted: ${expenseResult.deletedCount + groupResult.deletedCount + userResult.deletedCount}`);
    console.log('\n✨ You can now start fresh with new user, group, and expense data!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL data from the database!');
console.log('📋 This includes:');
console.log('   - All user accounts');
console.log('   - All groups');
console.log('   - All expenses');
console.log('   - All related data\n');

// Run the cleanup
clearAllData();