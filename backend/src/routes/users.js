const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireActiveAccount, logUserActivity } = require('../middleware/auth');

// We'll create these controller functions next
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats,
  getUserActivity
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);
router.use(requireActiveAccount);

// Get user profile
router.get('/profile', 
  logUserActivity('view_profile'),
  asyncHandler(getProfile)
);

// Update user profile
router.put('/profile', 
  logUserActivity('update_profile'),
  asyncHandler(updateProfile)
);

// Change password
router.put('/change-password', 
  logUserActivity('change_password'),
  asyncHandler(changePassword)
);

// Get user statistics
router.get('/stats', 
  logUserActivity('view_stats'),
  asyncHandler(getUserStats)
);

// Get user activity log
router.get('/activity', 
  logUserActivity('view_activity'),
  asyncHandler(getUserActivity)
);

// Delete user account (soft delete)
router.delete('/account', 
  logUserActivity('delete_account'),
  asyncHandler(deleteAccount)
);

module.exports = router;