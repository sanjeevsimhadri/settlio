const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Search users by email
// @route   GET /api/users/search?email=searchterm
// @access  Private
const searchUsers = asyncHandler(async (req, res, next) => {
  const { email } = req.query;

  if (!email || email.trim().length < 3) {
    return next(new ErrorResponse('Email search term must be at least 3 characters', 400));
  }

  try {
    // Search for users whose email contains the search term (case-insensitive)
    // Limit results to prevent abuse
    const users = await User.find({
      email: { 
        $regex: email.trim(), 
        $options: 'i' 
      }
    })
    .select('username email')  // Only return username and email for privacy
    .limit(10);                // Limit to 10 results

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return next(new ErrorResponse('Error searching users', 500));
  }
});

module.exports = {
  searchUsers
};