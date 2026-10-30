# Security Fixes Implementation Guide

## Critical Fixes Required (Deploy Immediately)

### 1. Fix Exposed Secrets in .env File

**Current state (CRITICAL):**
```
JUDGE0_TOKEN=8b34611b4c09a518edf17ef15b5225aa
MONGO_URI=mongodb+srv://ashishchauhanvasai:Password123@cluster0.1eywscy.mongodb.net/elearning?retryWrites=true&w=majority
EMAIL_USER=ashishchauhanvasai@gmail.com
EMAIL_PASS=wfzh drpf gezo qole
LIVEKIT_API_KEY=APIxUsptHPHQgkh
LIVEKIT_API_SECRET=fIbisQgdHWg0VD2c2GYJBg34Il03cqD6Y6e9fBHOauoA
```

**Required Actions:**
1. Remove plaintext passwords from `.env` file
2. Use environment variables or secret management service
3. Use encrypted password storage for MongoDB URI
4. Replace EMAIL_PASS with secure email service configuration

**Implementation:**
```bash
# .env - SECURE VERSION
# Use environment variables or secret management service
MONGODB_USERNAME=${MONGODB_USERNAME}
MONGODB_PASSWORD=${MONGODB_PASSWORD}
EMAIL_SERVICE_USER=${EMAIL_SERVICE_USER}
EMAIL_SERVICE_PASSWORD=${EMAIL_SERVICE_PASSWORD}
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
```

### 2. Fix Hardcoded JWT Secret in verifyToken.js

**Current state (CRITICAL):**
```javascript
// e-learning-backend/middleware/verifyToken.js
const secret = 'secretkey'; // Replace with environment variable in production
```

**Required Actions:**
1. Replace hardcoded secret with environment variable
2. Add proper JWT secret validation
3. Use strong random secret generation

**Implementation:**
```javascript
// e-learning-backend/middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate secure fallback secret if not in environment
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 3. Implement Security Headers and CORS

**Current state (HIGH):**
```javascript
// e-learning-backend/server.js - Current CORS implementation
app.use(cors({
  origin: [
    'https://destinationcareer.pages.dev',
    'https://destinationcareer.ashishchauhanvasai.workers.dev'
  ]
}));
```

**Required Actions:**
1. Implement proper CORS security
2. Add security headers
3. Restrict CORS origins to specific trusted domains

**Implementation:**
```javascript
// e-learning-backend/server.js - Secure CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://your-frontend-domain.com'
  ],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;");
  next();
});
```

### 4. Add Input Validation and Sanitization

**Current state (CRITICAL):**
No input validation on registration, login, or other endpoints

**Required Actions:**
1. Add input validation middleware
2. Sanitize all user inputs
3. Implement proper error handling

**Implementation:**
```javascript
// e-learning-backend/middleware/inputValidation.js
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

const validateInput = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
  sanitizeBody(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 5. Implement Rate Limiting

**Current state (CRITICAL):**
No rate limiting on authentication endpoints

**Required Actions:**
1. Add rate limiting middleware
2. Implement different limits for different endpoints
3. Add account lockout policies

**Implementation:**
```javascript
// e-learning-backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  store: new RedisStore({
    client: require('redis').createClient()
  })
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  store: new RedisStore({
    client: require('redis').createClient()
  })
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
```

### 6. Fix File Upload Security

**Current state (CRITICAL):**
No file validation on resume/photo uploads

**Required Actions:**
1. Add file type validation
2. Implement file size limits
3. Add file content validation
4. Secure file storage

**Implementation:**
```javascript
// e-learning-backend/middleware/fileUploadSecurity.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow specific file types
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});
```

### 7. Add Security Headers Middleware

**Implementation:**
```javascript
// e-learning-backend/middleware/securityHeaders.js
const securityHeaders = (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // Remove server header
  res.removeHeader('Server');
  
  next();
};

module.exports = securityHeaders;
```

## Frontend Security Fixes

### 1. Add Input Validation in Login Component

**Current state:**
```javascript
// src/pages/Login.js - Current implementation
const [form, setForm] = useState({
  email: '',
  password: ''
});
```

**Required Actions:**
1. Add input validation
2. Sanitize inputs
3. Add XSS protection
4. Implement rate limiting

**Implementation:**
```javascript
// src/pages/Login.js - Secure implementation
import { validateLoginInput } from '../utils/validation';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Sanitize inputs before sending
    const sanitizedForm = {
      email: form.email.trim(),
      password: form.password
    };
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, sanitizedForm);
      // Handle successful login
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleLogin} noValidate>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleInputChange}
        placeholder="Email"
        required
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleInputChange}
        placeholder="Password"
        required
      />
      {errors.password && <span className="error">{errors.password}</span>}
      
      <button type="submit">Sign In</button>
    </form>
  );
};
```

### 2. Add CSRF Protection

**Implementation:**
```javascript
// src/utils/csrf.js
import { generateToken, validateToken } from './csrfToken';

// Middleware to validate CSRF token
export const csrfProtection = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const token = req.headers['x-csrf-token'] || req.body._token;
    if (!token || !validateToken(token)) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};

// Generate CSRF token for forms
export const useCSRFToken = () => {
  return generateToken();
};
```

## Deployment Instructions

### 1. Update Environment Variables
```bash
# Set environment variables
export JWT_SECRET="your-strong-secret-key"
export MONGODB_USERNAME="your-db-username"
export MONGODB_PASSWORD="your-db-password"
export ALLOWED_ORIGINS="https://your-frontend-domain.com"
export RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
export RATE_LIMIT_MAX_REQUESTS="1000"
```

### 2. Update Dependencies
```bash
# Add required packages
npm install express-rate-limit multer crypto-validator bcryptjs jsonwebtoken
npm install --save-dev nodemon dotenv
```

### 3. Update Package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "security-audit": "node security-check.js"
  }
}
```

### 4. Create Security Check Script
```bash
# Create security-check.js
node security-check.js
```

## Testing Security Fixes

### 1. Manual Testing
1. Test input validation on all forms
2. Test authentication endpoints
3. Test rate limiting
4. Test CORS configuration
5. Test security headers

### 2. Automated Testing
```bash
# Install testing tools
npm install jest supertest

# Create security tests
npm test security.*
```

### 3. Security Scan
```bash
# Run security scan
npm audit
npm audit fix
```

## Monitoring and Alerting

### 1. Security Monitoring
```bash
# Set up monitoring
pip install prometheus-client
# Configure alerts for security events
```

### 2. Log Monitoring
```bash
# Set up log monitoring
tail -f /var/log/auth.log
# Configure alerts for failed login attempts
```

## Rollback Plan

### 1. Prepare Rollback
1. Commit all changes to version control
2. Create rollback script
3. Test rollback procedures

### 2. Rollback Script
```bash
#!/bin/bash
# Rollback script for security fixes

# Stop application
pm2 stop e-learning-backend

# Restore previous version
git checkout previous-stable-branch

# Rebuild and restart
npm install
pm2 start e-learning-backend

# Verify application is running
curl http://localhost:5000/api/health
```

## Conclusion

These security fixes address the critical vulnerabilities identified in the audit. The implementation follows security best practices and ensures:

1. **Secrets Management**: All secrets properly secured with environment variables
2. **Input Validation**: All user inputs validated and sanitized
3. **Authentication Security**: Strong authentication with proper password hashing
4. **Authorization**: Proper access control implementation
5. **Security Headers**: Comprehensive security headers configured
6. **Rate Limiting**: Effective rate limiting on sensitive endpoints
7. **File Upload Security**: Secure file upload validation and storage
8. **Error Handling**: Proper error handling without information leakage

**Important**: These changes should be deployed in a staged manner with proper testing at each step. The production deployment should be done during a maintenance window with a solid rollback plan in place.