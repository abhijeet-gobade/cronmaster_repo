const bcrypt = require('bcryptjs');
const { prisma } = require('../models');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} = require('../utils/jwt');
const { 
  validateRegistration, 
  validateLogin, 
  validateTokenRefresh,
  sanitizeInput 
} = require('../utils/validation');
const { 
  ConflictError, 
  AuthenticationError, 
  ValidationError,
  NotFoundError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
const register = async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validateRegistration(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { name, email, password } = value;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ 
    where: { email: email.toLowerCase() } 
  });
  
  if (existingUser) {
    throw new ConflictError('User already exists with this email address');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      account_status: true
    }
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  // Store refresh token session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.userSession.create({
    data: {
      user_id: user.id,
      token_hash: refreshTokenHash,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user_agent: req.get('User-Agent') || null,
      ip_address: req.ip || null
    }
  });

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: process.env.JWT_EXPIRES_IN || '30m'
      }
    }
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validateLogin(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { email, password } = value;

  // Find user
  const user = await prisma.user.findUnique({
    where: { 
      email: email.toLowerCase()
    }
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check account status
  if (user.account_status !== 'active') {
    throw new AuthenticationError('Account is suspended or inactive');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    logger.warn('Failed login attempt', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  // Store refresh token session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.userSession.create({
    data: {
      user_id: user.id,
      token_hash: refreshTokenHash,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user_agent: req.get('User-Agent') || null,
      ip_address: req.ip || null
    }
  });

  // Remove password from response
  const { password_hash, ...userWithoutPassword } = user;

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: process.env.JWT_EXPIRES_IN || '30m'
      }
    }
  });
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  // Validate input
  const { error, value } = validateTokenRefresh(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { refresh_token } = value;

  // Find valid session
  const session = await prisma.userSession.findUnique({
    where: { 
      refresh_token,
      expires_at: { gt: new Date() }
    },
    include: { 
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          account_status: true
        }
      }
    }
  });

  if (!session) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  if (session.user.account_status !== 'active') {
    throw new AuthenticationError('Account is suspended or inactive');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: session.user.id });
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);

  // Update session
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      token_hash: newRefreshTokenHash,
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt,
      last_used: new Date(),
      ip_address: req.ip || null
    }
  });

  logger.info('Token refreshed successfully', {
    userId: session.user.id,
    sessionId: session.id,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: process.env.JWT_EXPIRES_IN || '30m'
      }
    }
  });
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  const { refresh_token } = req.body;
  
  try {
    if (refresh_token) {
      // Delete specific session
      await prisma.userSession.deleteMany({
        where: { 
          refresh_token,
          user_id: req.user.id
        }
      });
    } else {
      // If no refresh token provided, delete all sessions for this user
      await prisma.userSession.deleteMany({
        where: { user_id: req.user.id }
      });
    }

    logger.info('User logged out successfully', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    // Even if there's an error, we should respond with success
    // since the client is trying to logout
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

/**
 * Forgot password (placeholder for future implementation)
 */
const forgotPassword = async (req, res) => {
  // This would typically:
  // 1. Validate email
  // 2. Generate reset token
  // 3. Send email with reset link
  // 4. Store reset token in database
  
  res.json({
    success: true,
    message: 'Password reset instructions sent to your email (Feature coming soon)'
  });
};

/**
 * Reset password (placeholder for future implementation)
 */
const resetPassword = async (req, res) => {
  // This would typically:
  // 1. Validate reset token
  // 2. Validate new password
  // 3. Update password
  // 4. Invalidate reset token
  
  res.json({
    success: true,
    message: 'Password reset successful (Feature coming soon)'
  });
};

/**
 * Verify email (placeholder for future implementation)
 */
const verifyEmail = async (req, res) => {
  // This would typically:
  // 1. Validate verification token
  // 2. Update user email_verified status
  // 3. Invalidate verification token
  
  res.json({
    success: true,
    message: 'Email verified successfully (Feature coming soon)'
  });
};

/**
 * Resend verification email (placeholder for future implementation)
 */
const resendVerification = async (req, res) => {
  // This would typically:
  // 1. Check if user exists
  // 2. Generate new verification token
  // 3. Send verification email
  
  res.json({
    success: true,
    message: 'Verification email sent (Feature coming soon)'
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};