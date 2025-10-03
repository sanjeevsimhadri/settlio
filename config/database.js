const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection options for better performance and stability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Database Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown (temporarily disabled for debugging)
    // process.on('SIGINT', async () => {
    //   try {
    //     await mongoose.connection.close();
    //     console.log('🔒 MongoDB connection closed through app termination');
    //     process.exit(0);
    //   } catch (error) {
    //     console.error('❌ Error during MongoDB disconnect:', error);
    //     process.exit(1);
    //   }
    // });

    return conn;
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('🚨 Error Details:', error.message);
    
    // Log additional connection debugging info
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 Server Selection Error - Check your connection string and network');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🔍 Mongoose Server Selection Error - Verify MongoDB Atlas cluster is running');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 DNS Resolution Error - Check your internet connection');
    }
    
    // Exit process with failure
    console.error('🛑 Application will exit due to database connection failure');
    process.exit(1);
  }
};

// Function to check if database is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Function to disconnect from database (useful for testing)
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed manually');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Export the functions
module.exports = {
  connectDB,
  isConnected,
  disconnectDB
};