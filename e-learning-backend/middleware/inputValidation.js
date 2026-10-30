// Secure input validation middleware
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

// Comprehensive input validation rules
const validateRegisterInput = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .matches(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, { message: 'Email format is invalid' })
    .isLength({ max: 254 }), // RFC 5321

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
             { message: 'Password must contain uppercase, lowercase, number, and special character' })
    .isLength({ max: 128 }),

  body('role')
    .optional()
    .isIn(['student', 'admin', 'trainer', 'promotional'])
    .withMessage('Invalid role specified'),

  sanitizeBody(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        success: false
      });
    }
    next();
  }
];

const validateLoginInput = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 }),

  sanitizeBody(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        success: false
      });
    }
    next();
  }
];

const validateForgotPasswordInput = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 }),

  sanitizeBody(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        success: false
      });
    }
    next();
  }
];

const validateResetPasswordInput = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 10 }),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
             { message: 'New password must contain uppercase, lowercase, number, and special character' }),

  sanitizeBody(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        success: false
      });
    }
    next();
  }
];

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
};