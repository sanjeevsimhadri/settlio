const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @desc    Upload profile photo
// @route   POST /api/auth/upload-photo
// @access  Private
const uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../../uploads/profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const fileExtension = path.extname(req.file.originalname);
  const fileName = `profile-${req.user.id}-${Date.now()}${fileExtension}`;
  const filePath = path.join(uploadsDir, fileName);

  // Save file to disk
  fs.writeFileSync(filePath, req.file.buffer);

  // Update user profile with photo URL
  const profilePhotoUrl = `/uploads/profiles/${fileName}`;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePhoto: profilePhotoUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {
      profilePhoto: profilePhotoUrl
    }
  });
});

module.exports = {
  upload,
  uploadProfilePhoto
};