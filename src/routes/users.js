const express = require('express');
const { searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected - user must be authenticated
router.use(protect);

// Search users by email
router.route('/search')
  .get(searchUsers);                                     // GET /api/users/search?email=... - Search users by email

module.exports = router;