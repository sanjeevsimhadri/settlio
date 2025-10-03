#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the MongoDB Atlas connection and validates database operations
 */

require('dotenv').config();
const { connectDB, isConnected, disconnectDB } = require('./config/database');

const testDatabaseConnection = async () => {
  console.log('🧪 Starting Database Connection Test...\n');

  try {
    // Test 1: Connect to database
    console.log('📡 Test 1: Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('✅ Connection test passed!\n');

    // Test 2: Check connection status
    console.log('🔍 Test 2: Checking connection status...');
    const connected = isConnected();
    if (connected) {
      console.log('✅ Connection status test passed!\n');
    } else {
      throw new Error('Connection status shows disconnected');
    }

    // Test 3: Test basic database operation
    console.log('🗄️  Test 3: Testing basic database operation...');
    const mongoose = require('mongoose');
    
    // Simple test schema
    const testSchema = new mongoose.Schema({
      testField: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    // Create a test document
    const testDoc = new TestModel({
      testField: 'Database connection test successful'
    });
    
    const saved = await testDoc.save();
    console.log('✅ Document created:', saved._id);
    
    // Read the test document
    const found = await TestModel.findById(saved._id);
    console.log('✅ Document retrieved:', found.testField);
    
    // Clean up - delete the test document
    await TestModel.findByIdAndDelete(saved._id);
    console.log('✅ Test document cleaned up\n');
    
    console.log('🎉 All database tests passed successfully!\n');

    // Test 4: Database information
    console.log('📊 Database Information:');
    console.log(`   Database Name: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Ready State: ${mongoose.connection.readyState} (1 = connected)`);
    console.log(`   Collections: ${Object.keys(mongoose.connection.collections).length}`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    // Test 5: Disconnect
    console.log('\n🔌 Test 5: Disconnecting from database...');
    await disconnectDB();
    console.log('✅ Disconnection test passed!');
    
    console.log('\n✨ Database test suite completed successfully! ✨');
    process.exit(0);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

// Run the test
testDatabaseConnection();