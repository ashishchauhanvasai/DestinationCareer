
// Secure rate limiting middleware using express-rate-limit memory store
const rateLimit = require('express-rate-limit');

// General rate limiting for API endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000
    )
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      success: false,
      retryAfter: Math.ceil(
        (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000
      )
    });
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 failed authentication attempts per hour

  skipSuccessfulRequests: true,
  skipFailedRequests: false,

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many authentication attempts. Please try again later or reset your password.',
      success: false,
      retryAfter: Math.ceil((60 * 60 * 1000) / 1000)
    });
  }
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS) || 10,

  message: {
    error: 'Too many upload attempts. Please try again later.',
    retryAfter: 300
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many upload attempts. Please try again later.',
      success: false,
      retryAfter: 300
    });
  }
});

// Rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password reset requests per hour

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password reset requests. Please try again later.',
      success: false,
      retryAfter: 3600
    });
  }
});

// Cleanup function (noop for memory store)
const cleanupRateLimit = async () => {
  return true;
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter,
  cleanupRateLimit
};
