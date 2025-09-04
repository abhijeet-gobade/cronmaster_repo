const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, logUserActivity } = require('../middleware/auth');

// We'll create these controller functions next
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', 
  logUserActivity('user_registration_attempt'),
  asyncHandler(register)
);

router.post('/login', 
  logUserActivity('user_login_attempt'),
  asyncHandler(login)
);

router.post('/refresh', 
  asyncHandler(refreshToken)
);

router.post('/forgot-password', 
  logUserActivity('forgot_password_request'),
  asyncHandler(forgotPassword)
);

router.post('/reset-password', 
  logUserActivity('password_reset_attempt'),
  asyncHandler(resetPassword)
);

router.get('/verify-email/:token', 
  asyncHandler(verifyEmail)
);

router.post('/resend-verification', 
  asyncHandler(resendVerification)
);

// Protected routes (authentication required)
router.post('/logout', 
  authenticateToken,
  logUserActivity('user_logout'),
  asyncHandler(logout)
);

// Validate token endpoint (useful for frontend)
router.get('/validate', 
  authenticateToken,
  (req, res) => {
    res.json({
      valid: true,
      user: req.user,
      message: 'Token is valid'
    });
  }
);

// Get current session info
router.get('/session', 
  authenticateToken,
  (req, res) => {
    res.json({
      user: req.user,
      sessionInfo: {
        loginTime: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
  }
);

module.exports = router;