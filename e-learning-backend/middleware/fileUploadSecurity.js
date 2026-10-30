// Secure file upload middleware
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use subdirectory based on file type
    let subDir = 'general';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype === 'application/pdf') {
      subDir = 'pdfs';
    } else if (file.mimetype.includes('word')) {
      subDir = 'documents';
    }

    const uploadPath = `${uploadDir}/${subDir}`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${randomName}${extension}`;

    // Create checksum for integrity verification
    const checksum = crypto.createHash('md5')
      .update(randomName + Date.now() + process.env.FILE_UPLOAD_SECRET || 'default-secret')
      .digest('hex');

    cb(null, filename);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Check file type
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Invalid file type. ` +
      `Allowed types: ${allowedTypes.join(', ')}. ` +
      `Received: ${file.mimetype}`
    ), false);
  }
};

// File size validation
const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize,
    files: 10, // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Virus scan simulation (replace with actual virus scanning)
const scanFile = async (filePath) => {
  try {
    // For production, integrate with virus scanning service
    // Examples: ClamAV, Sophos, or other antivirus APIs

    // For now, simulate scanning
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate scan result - replace with actual scanning
        const scanResult = {
          scanned: true,
          clean: true,
          timestamp: new Date().toISOString(),
          scanner: 'simulated',
          threatDetected: false
        };

        if (!scanResult.clean) {
          reject(new Error(`Virus detected in file: ${filePath}`));
          return;
        }

        resolve(scanResult);
      }, 100); // Simulate scan delay
    });
  } catch (err) {
    throw new Error(`File scan failed: ${err.message}`);
  }
};

// File integrity verification
const verifyFileIntegrity = (filePath, expectedChecksum) => {
  try {
    const fileData = fs.readFileSync(filePath);
    const calculatedChecksum = crypto.createHash('md5')
      .update(fileData.toString())
      .digest('hex');

    return calculatedChecksum === expectedChecksum;
  } catch (err) {
    return false;
  }
};

// Secure filename for download
const getSecureFilename = (originalName, storedFilename) => {
  // Sanitize original name for download
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);

  return {
    downloadName: sanitizedName,
    storedName: storedFilename
  };
};

module.exports = {
  upload,
  scanFile,
  fileFilter,
  verifyFileIntegrity,
  getSecureFilename,
  maxSize
};