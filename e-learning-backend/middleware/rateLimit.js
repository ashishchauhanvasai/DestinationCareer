// Secure rate limiting middleware
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis connection for rate limiting
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  legacyMode: true
});

// Connect Redis with error handling
redisClient.connect().catch(err => {
  console.error('Redis connection error:', err);
});

// General rate limiting for API endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Default: 1000 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      success: false,
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    });
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:',
    expiration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900
  })
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS_AUTH) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS) || 5, // Default: 5 requests per window
  message: {
    error: 'Too many authentication attempts. Please try again later or reset your password.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS_AUTH) || 15 * 60 * 1000) / 1000)
  },
  skipSuccessfulRequests: true, // Don't count successful requests towards limit
  skipFailedRequests: false, // Count failed requests towards limit
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many authentication attempts. Please try again later or reset your password.',
      success: false,
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS_AUTH) || 15 * 60 * 1000) / 1000)
    });
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth_rate_limit:',
    expiration: parseInt(process.env.RATE_LIMIT_WINDOW_MS_AUTH) / 1000 || 900
  })
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS) || 10, // Default: 10 uploads per 5 minutes
  message: {
    error: 'Too many upload attempts. Please try again later.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many upload attempts. Please try again later.',
      success: false,
      retryAfter: 300
    });
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'upload_rate_limit:',
    expiration: 300
  })
});

// Rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT) || 3, // Default: 3 password resets per hour
  message: {
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password reset requests. Please try again later.',
      success: false,
      retryAfter: 3600
    });
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'password_reset_rate_limit:',
    expiration: 3600
  })
});

// Cleanup function for Redis connections
const cleanupRateLimit = async () => {
  try {
    await redisClient.quit();
    console.log('Rate limit middleware cleaned up successfully');
  } catch (err) {
    console.error('Error cleaning up rate limit middleware:', err);
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter,
  cleanupRateLimit
};