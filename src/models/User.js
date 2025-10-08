const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Function to generate unique username from name and email
const generateUsername = async function(name, email) {
  const User = mongoose.model('User');
  
  // Create base username from name (remove spaces, convert to lowercase)
  let baseUsername = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  
  // If name is too short, use email prefix
  if (baseUsername.length < 3) {
    baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  }
  
  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = 'user' + baseUsername;
  }
  
  // Truncate if too long
  if (baseUsername.length > 25) {
    baseUsername = baseUsername.substring(0, 25);
  }
  
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists and add number if needed
  while (await User.findOne({ username })) {
    username = baseUsername + counter;
    if (username.length > 30) {
      // If adding counter makes it too long, truncate base and try again
      baseUsername = baseUsername.substring(0, 30 - counter.toString().length);
      username = baseUsername + counter;
    }
    counter++;
  }
  
  return username;
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    validate: {
      validator: function(v) {
        // Allow letters, spaces, hyphens, apostrophes, and dots
        return /^[a-zA-Z\s\-'\.]+$/.test(v);
      },
      message: 'Name can only contain letters, spaces, hyphens, apostrophes, and dots'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return false;
        const cleaned = v.replace(/[\s-()]/g, '');
        // Accept both international format and Indian format
        return /^\+[1-9]\d{1,14}$/.test(cleaned) || /^[6-9]\d{9}$/.test(cleaned);
      },
      message: 'Please enter a valid mobile number'
    }
  },
  profilePhoto: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      email: this.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Method to get user object without sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);