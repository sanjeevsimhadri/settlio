const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { syncUserWithGroupInvitations } = require('../utils/groupSync');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, mobile, password } = req.body;

  // Normalize mobile number (add +91 if it's a 10-digit Indian number)
  let normalizedMobile = mobile;
  const cleanMobile = mobile.replace(/[\s-()]/g, '');
  if (/^[6-9]\d{9}$/.test(cleanMobile)) {
    normalizedMobile = `+91${cleanMobile}`;
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { mobile: normalizedMobile }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ErrorResponse('User with this email already exists', 400));
    } else {
      return next(new ErrorResponse('User with this mobile number already exists', 400));
    }
  }

  // Generate unique username from name and email
  const generateUsername = async function(name, email) {
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

  const username = await generateUsername(name, email);

  // Create user
  const user = await User.create({
    username,
    name,
    email,
    mobile: normalizedMobile,
    password
  });

  // Sync with group invitations - update any pending invitations for this email
  try {
    await syncUserWithGroupInvitations(email, user._id);
  } catch (syncError) {
    // Log the error but don't fail the registration
    console.error('Error syncing group invitations for new user:', syncError);
  }

  // Generate token and send response
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { identifier, password } = req.body;

  // Check if identifier is provided
  if (!identifier) {
    return next(new ErrorResponse('Email or mobile number is required', 400));
  }

  // Normalize mobile number for search (add +91 if it's a 10-digit Indian number)
  let normalizedIdentifier = identifier;
  const cleanIdentifier = identifier.replace(/[\s-()]/g, '');
  
  // If it's a 10-digit number starting with 6-9, add +91
  if (/^[6-9]\d{9}$/.test(cleanIdentifier)) {
    normalizedIdentifier = `+91${cleanIdentifier}`;
  }

  // Find user by email or mobile number (search both original and normalized)
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { mobile: identifier },
      { mobile: normalizedIdentifier }
    ]
  }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid email or mobile number', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    profilePhoto: req.body.profilePhoto
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // Check if email is being changed and if it already exists
  if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
    const existingUser = await User.findOne({ email: fieldsToUpdate.email });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Email is already in use', 400));
    }
  }

  // Check if username is being changed and if it already exists
  if (fieldsToUpdate.username && fieldsToUpdate.username !== req.user.username) {
    const existingUser = await User.findOne({ username: fieldsToUpdate.username });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Username is already taken', 400));
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current password and new password', 400));
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 400));
  }

  // Validate new password
  if (newPassword.length < 6) {
    return next(new ErrorResponse('New password must be at least 6 characters long', 400));
  }

  if (currentPassword === newPassword) {
    return next(new ErrorResponse('New password must be different from current password', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    data: user
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};