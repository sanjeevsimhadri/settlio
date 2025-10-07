const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const groupRoutes = require('./src/routes/groups');
const userRoutes = require('./src/routes/users');
const expenseRoutes = require('./src/routes/expenses');
const balanceRoutes = require('./src/routes/balances');

const app = express();

// Trust proxy for rate limiting (required when behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development to avoid proxy issues
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api', balanceRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const { isConnected } = require('./config/database');
  
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected(),
      host: process.env.MONGO_URI ? 'MongoDB Atlas' : 'Not configured'
    },
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start the server after database connection is established
    const server = app.listen(PORT, () => {
      console.log('🚀 Server Configuration:');
      console.log(`   📡 Port: ${PORT}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`   🕒 Started at: ${new Date().toLocaleString()}`);
      console.log('\n✨ Settlio API Server is running successfully!\n');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📨 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('🔒 HTTP server closed');
        console.log('👋 Settlio API Server shutdown complete');
        process.exit(0);
      });
    };

    // Handle shutdown signals (temporarily disabled for debugging)
    // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;