// Secure JWT verification middleware
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Use environment variable or generate secure fallback
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// JWT token validation middleware
const validateToken = [
  (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
        success: false
      });
    }

    // Check token format
    if (token.split('.').length !== 3) {
      return res.status(401).json({
        message: 'Invalid token format',
        success: false
      });
    }

    next();
  },

  (req, res, next) => {
    try {
      const decoded = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET);

      // Validate decoded token
      if (!decoded.id || !decoded.role || !decoded.version) {
        return res.status(401).json({
          message: 'Invalid token payload',
          success: false
        });
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return res.status(401).json({
          message: 'Token expired',
          success: false
        });
      }

      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token signature',
          success: false
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expired',
          success: false
        });
      }

      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }
];

module.exports = { validateToken, JWT_SECRET };