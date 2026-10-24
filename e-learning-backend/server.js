// FIX: load the .env that sits next to this file, no matter which folder you start the server from
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');   
const app = express();
const port = process.env.PORT || 5000;
const axios = require('axios');
const multer = require('multer');
const PHOTO_MAX = 1 * 1024 * 1024;  
const RESUME_MAX = 2 * 1024 * 1024; 
const looksLikeJpgOrPng = (b) => b.length > 8 && ((b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || (b[0] === 0x89 && b.slice(1, 4).toString() === 'PNG'));
const looksLikePdf = (b) => b.length > 5 && b.slice(0, 5).toString() === '%PDF-';
const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v || '');
const phoneOk = (v) => /^\d{10}$/.test(v || '');
const urlOn = (value, domain) => { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && (u.hostname === domain || u.hostname.endsWith('.' + domain)); } catch { return false; } };


// FIX: the JWT secret now comes from .env (falls back to the old value so logged-in users are not kicked out)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(cors({ 
  origin: [
    'https://destinationcareer.pages.dev', 
    'https://destinationcareer.ashishchauhanvasai.workers.dev'
  ] 
}));
// Increase limits to allow image uploads (Base64 strings)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 1. MONGODB CONNECTION
// FIX: the connection string is no longer written in this file. Put MONGO_URI in e-learning-backend/.env
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI is missing. Add it to e-learning-backend/.env and restart.');
  process.exit(1);
}
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB via Mongoose"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- Testimonial Schema ---
// --- NEW SCHEMAS FOR DASHBOARD ---
const testimonialSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  company: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String, default: 'https://via.placeholder.com/150' },
  education: { type: String, default: '' },
  passoutYear: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  role: { type: String, default: '' },
  salaryPackage: { type: String, default: '' }
});

// MAKE SURE THIS LINE EXISTS:
const Testimonial = mongoose.model('Testimonial', testimonialSchema);


// --- Top Performer Schema ---
const topPerformerSchema = new mongoose.Schema({
  category: { type: String, enum: ['Java', 'Python', 'Data Analytics', 'Frontend'], required: true },
  studentName: { type: String, required: true },
  imageUrl: { type: String, default: 'https://via.placeholder.com/150' },
  metric: { type: String, default: 'Top Scorer' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }); // ✅ FIX: Added timestamps here so sorting works perfectly

const TopPerformer = mongoose.model('TopPerformer', topPerformerSchema);

const dns = require('dns');

// Prefer IPv4 to avoid IPv6 connection timeouts on some cloud hosts (including Render).
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const EMAIL_USER = process.env.EMAIL_USER;

// Custom HTTPS Transporter using Google Apps Script Webhook (Bypasses Render SMTP block)
const transporter = {
  sendMail: async (mailOptions, callback) => {
    try {
      if (!process.env.GMAIL_WEBHOOK_URL) {
        throw new Error("GMAIL_WEBHOOK_URL is missing in Environment Variables");
      }

      const response = await fetch(process.env.GMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow', // Important: Google Apps Script redirects on POST
        body: JSON.stringify({
          to: Array.isArray(mailOptions.to) ? mailOptions.to.join(',') : mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html || mailOptions.text
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Gmail Webhook failed to send email");
      }

      if (typeof callback === 'function') callback(null, result);
      return result;
    } catch (error) {
      console.error("Email Webhook Error:", error.message);
      if (typeof callback === 'function') callback(error, null);
      else throw error;
    }
  },

  // Supports existing transporter.verify() calls without crashing
  verify: (callback) => {
    if (process.env.GMAIL_WEBHOOK_URL) {
      if (typeof callback === 'function') callback(null, true);
    } else {
      const err = new Error("GMAIL_WEBHOOK_URL is not configured in Render Environment Variables!");
      if (typeof callback === 'function') callback(err, false);
    }
  }
};

// Test connection on startup (will show in Render logs)
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email Webhook Setup Error:", error.message);
  } else {
    console.log("✅ Gmail HTTPS Webhook is ready to send emails!");
  }
});         


// 0. DATABASE SCHEMAS
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'campus_student', 'admin', 'superadmin', 'trainer', 'promotional'], default: 'student' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
  registeredDrive: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeDrive', default: null }, 
  employabilityScore: { type: Number, default: 0 },

  // --- STUDENT ELIGIBILITY PROFILE ---
  highestQualification: { type: String, default: '' },
  passingYear: { type: String, default: '' },
  percentage: { type: Number, default: null },
  backlogs: { type: Number, default: 0 },
  educationGap: { type: Number, default: 0 },
  readyForRelocation: { type: Boolean, default: false },
  contactNumber: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  skillsAcquired: { type: String, default: '' }, // Stored as comma-separated string
  
  // --- Flag to lock profile after first edit ---
  profileLocked: { type: Boolean, default: false },

  // NEW: Profile Picture (Base64 string store karne ke liye)
  profilePic: { type: String, default: '' },                        


  // --- STUDENT ELIGIBILITY PROFILE ---
  highestQualification: { type: String, default: '' },
  passingYear: { type: String, default: '' },
  percentage: { type: Number, default: null },
  backlogs: { type: Number, default: 0 },
  educationGap: { type: Number, default: 0 },
  readyForRelocation: { type: Boolean, default: false },
  contactNumber: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  skillsAcquired: { type: String, default: '' },

  // --- NEW FIELDS FOR CAMPUS REGISTRATION ---
  stream: { type: String, default: '' },
  branch: { type: String, default: '' },
  yearOfStudy: { type: String, default: '' },
  tenthPercentage: { type: Number, default: null },
  twelfthPercentage: { type: Number, default: null },
  panCard: { type: String, default: '' },


  // --- STRICT 1 DESKTOP + 1 MOBILE DEVICE BINDING ---
  // Existing field names are retained for compatibility with the current admin UI.
  allowedDesktopId: { type: String, default: null },
  pendingDesktopId: { type: String, default: null },
  desktopChangeRequested: { type: Boolean, default: false },
  allowedMobileId: { type: String, default: null },
  pendingMobileId: { type: String, default: null },
  mobileChangeRequested: { type: Boolean, default: false },

  // New descriptive aliases used by the updated device-approval logic.
  // Both old and new fields are synchronized to avoid breaking existing records/UI.
  desktopDeviceId: { type: String, default: null },
  pendingDesktopDeviceId: { type: String, default: null },
  mobileDeviceId: { type: String, default: null },
  pendingMobileDeviceId: { type: String, default: null },
  
  tokenVersion: { type: Number, default: 0 },

  // trainers only: the top-performer category he can manage
  domain: { type: String, enum: ['', 'Java', 'Python', 'Data Analytics', 'Frontend'], default: '' }
});

// Hash password before saving (requires bcryptjs)
userSchema.pre('save', async function () {
  // If password is not modified, exit the function (Mongoose continues automatically)
  if (!this.isModified('password')) return;
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🚀 SPEED BOOST: Index frequently queried fields
userSchema.index({ role: 1, status: 1 });
userSchema.index({ registeredDrive: 1, status: 1 });

const User = mongoose.model('User', userSchema);


// --- 1. BANNER SCHEMA ---
const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true }
});
const Banner = mongoose.model('Banner', bannerSchema);

// --- 2. BANNER ROUTES ---
app.get('/api/banner', async (req, res) => {
  try {
    const banner = await Banner.findOne().sort({ _id: -1 }); 
    res.json(banner || { imageUrl: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/banner', async (req, res) => {
  try {
    await Banner.deleteMany({}); // Keep only 1 banner at a time
    const newBanner = new Banner({ imageUrl: req.body.imageUrl });
    await newBanner.save();
    res.json(newBanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const courseSchema = new mongoose.Schema({
  subjectTitle: { type: String, required: true },
  description: String,
  topics: [
    {
      topicName: String,
      videos: [
        {
          videoTitle: String,
          description: String,
          youtubeUrl: String
        }
      ]
    }
  ]
});
const Course = mongoose.model('Course', courseSchema);

// --- UPGRADED JOB SCHEMA FOR MATCHING ENGINE ---
const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  companyAbout: { type: String, default: '' },
  description: { type: String, required: true }, // Can hold a link to a PDF/Drive file
  
  // Job Details
  location: { type: String, required: true },
  salary: { type: String, default: 'As per industry standards' },
  hiringProcess: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
  interviewDate: { type: String, default: 'To be announced' },
  interviewLocation: { type: String, default: 'TBA' },
  lastDateToApply: { type: Date, required: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  datePosted: { type: Date, default: Date.now },

  // Strict Eligibility Criteria (To match against Student Profile)
  reqEmployabilityScore: { type: Number, default: 0 },
  reqQualification: { type: String, required: true },
  reqPassingYear: { type: String, required: true },
  reqMinPercentage: { type: Number, default: 0 },
  reqMaxBacklogs: { type: Number, default: 0 },
  reqMaxEducationGap: { type: Number, default: 0 },
  reqSkills: { type: String, default: '' } // Comma separated
});
const Job = mongoose.model('Job', jobSchema);
// ============================================================================
// MISSING JOB APPLICATIONS SCHEMA & GRIDFS SETUP
// ============================================================================
const APP_STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Next Round', 'Selected', 'Rejected'];

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  parentPhone: { type: String, required: true },
  linkedin: { type: String, required: true },
  github: { type: String, required: true },
  photoFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  resumeFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: APP_STATUSES, default: 'Applied' },
  roundNo: { type: Number, default: 1 },
  interviewDate: { type: String, default: '' },
  remarks: { type: String, default: '' },
  history: [{
    status: String,
    roundNo: Number,
    interviewDate: String,
    message: { type: String, default: '' },
    changedBy: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
applicationSchema.index({ student: 1, job: 1 }, { unique: true });
const Application = mongoose.model('Application', applicationSchema);

let filesBucket;
const getBucket = () => {
  if (!filesBucket) {
    filesBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'applicationFiles' });
  }
  return filesBucket;
};

const saveToGridFS = (file, kind) => new Promise((resolve, reject) => {
  const stream = getBucket().openUploadStream(file.originalname, {
    contentType: file.mimetype,
    metadata: { kind }
  });
  stream.on('error', reject);
  stream.on('finish', () => resolve(stream.id));
  stream.end(file.buffer);
});

const deleteGridFile = async (id) => {
  try { await getBucket().delete(new mongoose.Types.ObjectId(String(id))); }
  catch (e) { /* file already gone */ }
};
// ============================================================================

// Auto-create Super Admin
const createSuperAdmin = async () => {
  try {
    let superAdmin = await User.findOne({ email: 'super@test.com' });
    
    if (!superAdmin) {
      superAdmin = new User({ 
        name: 'Master Super Admin', 
        email: 'super@test.com', 
        password: 'superpassword', 
        role: 'superadmin', 
        status: 'approved'
      });
      await superAdmin.save(); 
      console.log("✅ Superadmin created with hashed password");
    } else {
      if (!superAdmin.password.startsWith('$2a$') && !superAdmin.password.startsWith('$2b$')) {
        superAdmin.password = 'superpassword'; 
        await superAdmin.save(); 
        console.log("✅ Superadmin plain-text password converted to secure hash");
      }
    }
  } catch (err) {
    console.error("Superadmin creation error:", err);
  }
};
createSuperAdmin();

// 3. AUTH MIDDLEWARE
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('tokenVersion');
    if (!user || user.tokenVersion !== decoded.version) {
      return res.status(401).json({ message: 'Session expired or device access revoked. Please log in again.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};


// Delete a College Drive
app.delete('/api/drives/:id', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    // 1. Delete the Drive itself
    await CollegeDrive.findByIdAndDelete(req.params.id);
    
    // 2. Delete all Test Submissions for this drive
    await DriveSubmission.deleteMany({ drive: req.params.id }); 
    
    // 3. FIX: Delete all student accounts that registered for this specific drive
    await User.deleteMany({ registeredDrive: req.params.id, role: 'campus_student' });
    
    res.json({ message: 'Drive, test submissions, and all registered students deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Mark Drive as Completed / Ongoing
app.put('/api/drives/:id/status', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  try {
    const drive = await CollegeDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    await CollegeDrive.findByIdAndUpdate(req.params.id, { isActive: !drive.isActive });
    res.json({ message: 'Status updated' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const assignedRole = role === 'admin' ? 'admin' : 'student';
    
    const newUser = new User({ 
      name, 
      email, 
      password, 
      role: assignedRole, 
      status: 'pending' // They must wait for admin approval
    });
    
    await newUser.save();
    
    res.status(201).json({ message: 'Registration submitted. Awaiting approval.' });
  } catch (err) {
    console.error("Registration Error:", err); 
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password, deviceId, deviceType } = req.body;

    // 🚀 SPEED BOOST: Exclude heavy profilePic during login check
    const user = await User.findOne({ email }).select('-profilePic');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Pending verification.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Registration declined.' });
    }

    // Device locking applies only to students.
    if (user.role === 'student' || user.role === 'campus_student') {
      if (typeof deviceId !== 'string' || !deviceId.trim()) {
        return res.status(400).json({
          message: 'Device identification is missing. Please refresh the page and try again.'
        });
      }

      // Support both the explicit deviceType and the MOB- prefix from the frontend ID.
      const normalizedDeviceType = String(deviceType || '').toLowerCase();
      const isMobileDevice =
        normalizedDeviceType === 'mobile' || deviceId.startsWith('MOB-');

      if (normalizedDeviceType && !['mobile', 'desktop'].includes(normalizedDeviceType)) {
        return res.status(400).json({
          message: 'Invalid device type. Use desktop or mobile.'
        });
      }

      if (isMobileDevice) {
        // Read the new field first, with fallback to the existing field for old records.
        const savedMobileId = user.mobileDeviceId || user.allowedMobileId;

        if (!savedMobileId) {
          // First login or device was reset by an administrator: bind this device.
          user.mobileDeviceId = deviceId;
          user.allowedMobileId = deviceId;
          user.mobileChangeRequested = false;
          user.pendingMobileDeviceId = null;
          user.pendingMobileId = null;
          await user.save();
        } else if (savedMobileId !== deviceId) {
          // New device: preserve the existing approved ID and store the request.
          user.mobileChangeRequested = true;
          user.pendingMobileDeviceId = deviceId;
          user.pendingMobileId = deviceId;
          await user.save();

          return res.status(403).json({
            message: 'New mobile device detected! Approval request sent to Admin.'
          });
        } else if (user.mobileDeviceId !== deviceId || user.allowedMobileId !== deviceId) {
          // Keep old and new field names synchronized for existing records.
          user.mobileDeviceId = deviceId;
          user.allowedMobileId = deviceId;
          await user.save();
        }
      } else {
        const savedDesktopId = user.desktopDeviceId || user.allowedDesktopId;

        if (!savedDesktopId) {
          user.desktopDeviceId = deviceId;
          user.allowedDesktopId = deviceId;
          user.desktopChangeRequested = false;
          user.pendingDesktopDeviceId = null;
          user.pendingDesktopId = null;
          await user.save();
        } else if (savedDesktopId !== deviceId) {
          user.desktopChangeRequested = true;
          user.pendingDesktopDeviceId = deviceId;
          user.pendingDesktopId = deviceId;
          await user.save();

          return res.status(403).json({
            message: 'New laptop/desktop detected! Approval request sent to Admin.'
          });
        } else if (user.desktopDeviceId !== deviceId || user.allowedDesktopId !== deviceId) {
          user.desktopDeviceId = deviceId;
          user.allowedDesktopId = deviceId;
          await user.save();
        }
      }
    }

    // JWT TOKEN GENERATION
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        version: user.tokenVersion
      },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    let driveCode = null;
    if (user.role === 'campus_student' && user.registeredDrive) {
      const d = await CollegeDrive.findById(user.registeredDrive).select('driveCode');
      driveCode = d?.driveCode || null;
    }

    res.json({
      message: 'Login successful',
      role: user.role,
      token,
      userId: user._id,
      driveCode
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN APPROVE DEVICE CHANGE ---
app.put('/api/users/:id/approve-device', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let deviceApproved = false;

    if (user.desktopChangeRequested) {
      // Never overwrite the approved ID with null if no pending ID exists.
      const pendingId = user.pendingDesktopDeviceId || user.pendingDesktopId;
      if (pendingId) {
        user.desktopDeviceId = pendingId;
        user.allowedDesktopId = pendingId;
        user.pendingDesktopDeviceId = null;
        user.pendingDesktopId = null;
        user.desktopChangeRequested = false;
        deviceApproved = true;
      }
    }

    if (user.mobileChangeRequested) {
      const pendingId = user.pendingMobileDeviceId || user.pendingMobileId;
      if (pendingId) {
        user.mobileDeviceId = pendingId;
        user.allowedMobileId = pendingId;
        user.pendingMobileDeviceId = null;
        user.pendingMobileId = null;
        user.mobileChangeRequested = false;
        deviceApproved = true;
      }
    }

    if (!deviceApproved) {
      return res.status(400).json({
        message: 'No valid pending device requests found for this user.'
      });
    }

    // Invalidate previously issued sessions after device approval.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.json({ message: 'Device permanently approved! Old sessions have been logged out.' });
  } catch (error) {
    console.error('Approve device error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Course Routes ---
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    res.json(course);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/courses', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.json({ message: 'Course added', course: newCourse });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/courses/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const oldCourse = await Course.findById(req.params.id);
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    
    if (oldCourse && updatedCourse) {
       const oldVideoIds = oldCourse.topics.flatMap(t => t.videos.flatMap(v => [String(v._id), v.youtubeUrl]));
       const newVideoIds = updatedCourse.topics.flatMap(t => t.videos.flatMap(v => [String(v._id), v.youtubeUrl]));
       const removed = oldVideoIds.filter(id => !newVideoIds.includes(id));
       if (removed.length > 0) {
          await Doubt.deleteMany({ videoId: { $in: removed } });
       }
    }

    res.json({ message: 'Course updated', course: updatedCourse });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/courses/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      const videoIds = course.topics.flatMap(t => t.videos.flatMap(v => [String(v._id), v.youtubeUrl]));
      await Doubt.deleteMany({ videoId: { $in: videoIds } });
      await course.deleteOne();
    }
    res.json({ message: 'Course and related discussions deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const isAdminOrSuper = (req) => req.user.role === 'admin' || req.user.role === 'superadmin';
const isSuperAdmin = (req) => req.user.role === 'superadmin';
const isTrainer = (req) => req.user.role === 'trainer';

// 1. Fetch all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ datePosted: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Post a new job (Admin)
app.post('/api/jobs', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// --- Testimonials API ---
app.get('/api/testimonials', async (req, res) => {
  const data = await Testimonial.find();
  res.json(data);
});
app.post('/api/testimonials', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).send('Denied');
  const newTestimonial = new Testimonial(req.body);
  await newTestimonial.save();
  res.json(newTestimonial);
});
app.put('/api/testimonials/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).send('Denied');
  const updatedTestimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  res.json(updatedTestimonial);
});
app.delete('/api/testimonials/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).send('Denied');
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});


// --- USER APPROVALS API ---
app.get('/api/users/pending', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.put('/api/users/:id/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  
  try {
    const { status } = req.body; 
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    
    if (status === 'approved') {
      const mailOptions = {
        from: `"Destination Career" <${EMAIL_USER}>`,
        to: user.email,
        subject: '🎉 Congratulations! Your Account is Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #2563eb;">Welcome to Destination Career!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Congratulations! Your registration 
            has been reviewed and approved by our administrative team.</p>
            <p>You can now log in to your dashboard to access your courses, mock tests, and placement resources.</p>
            <a href="https://bit.ly/ashishdc" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Dashboard</a>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not request this account, please ignore this email.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("Error sending approval email:", error);
        else console.log("Approval email sent to:", user.email);
      });
    }

    res.json({ message: `User marked as ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STUDENT PROFILE ROUTES ---
app.get('/api/users/me/credentials', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Update Profile (Student - One Time Only) ---
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profileLocked) {
      return res.status(403).json({ 
        message: 'Your profile is locked. Please contact an admin to make changes.' 
      });
    }

    const { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired } = req.body;
    
    user.highestQualification = highestQualification;
    user.passingYear = passingYear;
    user.percentage = percentage;
    user.backlogs = backlogs;
    user.educationGap = educationGap;
    user.readyForRelocation = readyForRelocation;
    user.skillsAcquired = skillsAcquired;
    user.profileLocked = true; 
    
    await user.save();
    
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN DELETE JOB ---
app.delete('/api/jobs/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Update Profile (Skills Unlocked & Promo Fields) ---
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired, contactNumber, address } = req.body;
    
    // Skills can ALWAYS be updated, regardless of lock
    user.skillsAcquired = skillsAcquired;

    // Allow promo team to save contact details
    if (user.role === 'promotional') {
      user.contactNumber = contactNumber;
      user.address = address;
    }
    
    // Only lock other fields for students
    if (!user.profileLocked && user.role === 'student') {
      user.highestQualification = highestQualification;
      user.passingYear = passingYear;
      user.percentage = percentage;
      user.backlogs = backlogs;
      user.educationGap = educationGap;
      user.readyForRelocation = readyForRelocation;
      user.profileLocked = true; 
    }
    
    await user.save();
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// UPLOAD PROFILE PICTURE (Student)
// =========================================================
app.put('/api/users/profile-pic', verifyToken, async (req, res) => {
  try {
    const { base64Image } = req.body;
    await User.findByIdAndUpdate(req.user.id, { profilePic: base64Image });
    res.json({ message: 'Profile picture updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= COMMUNITY DOUBTS & DISCUSSIONS =================
const doubtSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  isResolved: { type: Boolean, default: false }, // True if a correct answer exists
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    replyText: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }, // Verified answer flag
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Doubt = mongoose.model('Doubt', doubtSchema);

app.get('/api/doubts/:videoId', verifyToken, async (req, res) => {
  try {
    const doubts = await Doubt.find({ videoId: req.params.videoId })
      .populate('user', 'name role')
      .populate('replies.user', 'name role')
      .sort({ createdAt: -1 });
    res.json(doubts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doubts', verifyToken, async (req, res) => {
  try {
    const { videoId, question } = req.body;
    const newDoubt = await Doubt.create({ videoId, user: req.user.id, question });
    await newDoubt.populate('user', 'name role');
    res.status(201).json(newDoubt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/doubts/:id/reply', verifyToken, async (req, res) => {
  try {
    const { replyText } = req.body;
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.replies.push({ user: req.user.id, replyText });
    await doubt.save();
    
    await doubt.populate('user', 'name role');
    await doubt.populate('replies.user', 'name role');
    res.json(doubt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/doubts/:id/replies/:replyId/correct', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only trainers or admins can validate answers.' });
  }
  try {
    const doubt = await Doubt.findById(req.params.id);  
    if (!doubt) return res.status(404).json({ message: 'Doubt thread not found' });

    const reply = doubt.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    reply.isCorrect = req.body.isCorrect !== undefined ? req.body.isCorrect : true;
    doubt.isResolved = doubt.replies.some(r => r.isCorrect); // Auto-resolve thread
    
    await doubt.save();
    
    await doubt.populate('user', 'name role');
    await doubt.populate('replies.user', 'name role');
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/doubts/:id', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only trainers or admins can delete doubts.' });
  }
  try {
    await Doubt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doubt thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/admin-edit-profile', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired, profileLocked } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired, profileLocked }, 
      { returnDocument: 'after' }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NEW JOB ROUTES ---
app.get('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id/status', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json(job);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- COMPANY QUESTIONS ---
const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  tags: [String],
  questions: [
    {
      title: { type: String, required: true },
      difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
      topic: { type: String, default: '' },
      description: { type: String, default: '' },
      answer: { type: String, default: '' }
    }
  ]
}, { timestamps: true });
const Company = mongoose.model('Company', companySchema);

const isAdminUser = (req) => req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'trainer';

app.get('/api/companies', verifyToken, async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/companies', verifyToken, async (req, res) => {
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { name, tags } = req.body;
    const company = await Company.create({ name, tags: tags || [] });
    res.status(201).json(company);
  } catch (err) {
    const msg = err.code === 11000 ? 'Company already exists' : err.message;
    res.status(400).json({ message: msg });
  }
});

app.put('/api/companies/:id', verifyToken, async (req, res) => {
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { name, tags } = req.body;
    const company = await Company.findByIdAndUpdate(req.params.id, { name, tags }, { returnDocument: 'after' });
    res.json(company);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/companies/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Only admins can delete a company' });
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/companies/:id/questions', verifyToken, async (req, res) => {
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    company.questions.push(req.body);
    await company.save();
    res.json(company);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/companies/:id/questions/:qid', verifyToken, async (req, res) => {
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const company = await Company.findById(req.params.id);
    const q = company?.questions.id(req.params.qid);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    q.set(req.body);
    await company.save();
    res.json(company);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/companies/:id/questions/:qid', verifyToken, async (req, res) => {
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    company.questions = company.questions.filter((q) => String(q._id) !== req.params.qid);
    await company.save();
    res.json(company);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

  // ================= ASSIGNMENTS =================
  const assignmentImageSchema = new mongoose.Schema({
    data: Buffer,
    contentType: String
  }, { timestamps: true });
  const AssignmentImage = mongoose.model('AssignmentImage', assignmentImageSchema);

  const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    description: { type: String, default: '' },
    topics: [{
      topicName: { type: String, required: true },
      questions: [{
        qType: { type: String, enum: ['MCQ', 'Descriptive'], default: 'Descriptive' },
        text: { type: String, required: true },
        images: [String],                       // ids from AssignmentImage
        options: [String],                      // MCQ only
        correctIndex: { type: Number, default: 0 },
        explanation: { type: String, default: '' },
        marks: { type: Number, default: 1 }
      }]
    }],
    audience: { type: String, enum: ['everyone', 'batches'], default: 'everyone' },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' }
  }, { timestamps: true });
  const Assignment = mongoose.model('Assignment', assignmentSchema);

  const answerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: Number,
    text: { type: String, default: '' },
    isCorrect: Boolean,
    marks: { type: Number, default: 0 },
    graded: { type: Boolean, default: false },
    feedback: { type: String, default: '' }
  }, { timestamps: true });
  answerSchema.index({ user: 1, questionId: 1 }, { unique: true });
  const AssignmentAnswer = mongoose.model('AssignmentAnswer', answerSchema);

  const adminOnly = (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'trainer') {
      res.status(403).json({ message: 'Access denied' });
      return false;
    }
    return true;
  };

  const findQuestion = (assignment, qid) => {
    for (const t of assignment.topics) {
      const q = t.questions.find((x) => String(x._id) === String(qid));
      if (q) return q;
    }
    return null;
  }

  const answerView = (ans, q) => ({
    questionId: String(ans.questionId),
    selectedIndex: ans.selectedIndex,
    text: ans.text,
    isCorrect: ans.isCorrect,
    marks: ans.marks,
    graded: ans.graded,
    feedback: ans.feedback,
    ...(q && q.qType === 'MCQ' ? { correctIndex: q.correctIndex, explanation: q.explanation } : {})
  });

// ---- Images ----
app.post('/api/assignment-images', verifyToken, async (req, res) => {
  if (!adminOnly(req, res)) return;
  try {
    const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(req.body.dataUrl || '');
    if (!m) return res.status(400).json({ message: 'Invalid image' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 3 * 1024 * 1024) return res.status(400).json({ message: 'Image too large (max 3MB)' });
    const img = await AssignmentImage.create({ data: buf, contentType: m[1] });
    res.json({ id: img._id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignment-images/:id', async (req, res) => {
  try {
    const img = await AssignmentImage.findById(req.params.id);
    if (!img) return res.status(404).end();
    res.set('Content-Type', img.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(img.data);
  } catch { res.status(404).end(); }
});

const mockRatingSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  technicalRating: { type: Number, required: true, min: 1, max: 10 },
  communicationRating: { type: Number, required: true, min: 1, max: 10 },
  codingRating: { type: Number, required: true, min: 1, max: 10 },
  remarks: { type: String, default: '' }
}, { timestamps: true });
const MockRating = mongoose.model('MockRating', mockRatingSchema);

// ================= ATTENDANCE SYSTEM =================
const batchSchema = new mongoose.Schema({
  batchCode: { type: String, required: true, unique: true, trim: true },
  subject: { type: String, required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerName: { type: String, required: true },
  venue: { type: String, required: true },
  location: { type: String, default: '' },
  scheduledStartTime: { type: String, default: '' }, // e.g. "06:00 PM"
  scheduledEndTime: { type: String, default: '' },   // e.g. "08:00 PM"
  durationMinutes: { type: Number, default: 60 },
  expectedStrength: { type: Number, default: 0 },
  qrToken: { type: String, required: true },         // static, printed QR secret
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
const Batch = mongoose.model('Batch', batchSchema);

const classSessionSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true },         // 'YYYY-MM-DD'
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date, default: null },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  currentToken: { type: String, default: '' },       // rotates while open
  tokenIssuedAt: { type: Date, default: null }
}, { timestamps: true });
const ClassSession = mongoose.model('ClassSession', classSessionSchema);

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now }
}, { timestamps: true });
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attendanceSchema);

const dateKeyOf = (d = new Date()) => d.toISOString().slice(0, 10);

// ================= PASSWORD RESET OTP =================
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});
const OTP = mongoose.model('OTP', otpSchema);

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const mailOptions = {
      from: `"Destination Career" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Destination Career Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Use the following OTP to reset your Destination Career password:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        </div>
      `
    };

    // ⏳ Timeout protection (8 seconds) so request never hangs in (pending) state
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SMTP connection timed out. Please try again.')), 8000)
    );

    await Promise.race([sendMailPromise, timeoutPromise]);

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to send email.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });
    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = newPassword;
    await user.save();
    await OTP.deleteMany({ email });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- SUPERADMIN: trainer accounts ----------
app.post('/api/trainers', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Only super admin can add trainers' });
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' });
    const trainer = await User.create({ name, email, password, role: 'trainer', status: 'approved' });

    const loginUrl = `${APP_URL}/login`;

    transporter.sendMail({
      from: `"Destination Career" <${EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Destination Career — Trainer Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Your trainer account has been created on Destination Career.</p>
          <p><strong>Login Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Dashboard</a>
        </div>
      `
    }, (err) => { if (err) console.error('Trainer welcome email failed:', err); });

    res.status(201).json({ _id: trainer._id, name: trainer.name, email: trainer.email });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/trainers', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  res.json(await User.find({ role: 'trainer' }).select('name email status'));
});

// ---------- SUPERADMIN: batches ----------
app.post('/api/batches', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Only super admin can create batches' });
  try {
    const { batchCode, subject, trainerId, venue, location, scheduledStartTime, scheduledEndTime, durationMinutes, expectedStrength } = req.body;
    const trainerUser = await User.findOne({ _id: trainerId, role: 'trainer' });
    if (!trainerUser) return res.status(400).json({ message: 'Select a valid trainer' });
    const batch = await Batch.create({
      batchCode, subject, trainer: trainerUser._id, trainerName: trainerUser.name,
      venue, location, scheduledStartTime, scheduledEndTime,
      durationMinutes: Number(durationMinutes) || 60,
      expectedStrength: Number(expectedStrength) || 0,
      qrToken: crypto.randomBytes(12).toString('hex')
    });

    transporter.sendMail({
      from: `"Destination Career" <${EMAIL_USER}>`,
      to: trainerUser.email,
      subject: `📚 New Batch Assigned: ${subject} (${batchCode})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #2563eb;">New Batch Assigned</h2>
          <p>Hi ${trainerUser.name},</p>
          <ul>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Batch Code:</strong> ${batchCode}</li>
            <li><strong>Venue:</strong> ${venue}${location ? `, ${location}` : ''}</li>
          </ul>
        </div>
      `
    }, (err) => { if (err) console.error('Batch assigned email failed:', err); });

    res.status(201).json(batch);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Batch code already exists' : e.message });
  }
});

app.get('/api/batches', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  res.json(await Batch.find().sort({ createdAt: -1 }));
});

app.delete('/api/batches/:id', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Only super admin can delete batches' });
  await Batch.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/batches/:id/qr', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Access denied' });
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  res.json({ qrValue: `BQR:${batch._id}:${batch.qrToken}` });
});

// ---------- TRAINER: my batches ----------
app.get('/api/batches/mine', verifyToken, async (req, res) => {
  if (!isTrainer(req)) return res.status(403).json({ message: 'Access denied' });
  const batches = await Batch.find({ trainer: req.user.id, isActive: true }).lean();
  const today = dateKeyOf();
  const result = await Promise.all(batches.map(async (b) => {
    const classesTaken = await ClassSession.countDocuments({ batch: b._id, status: 'closed' });
    const open = await ClassSession.findOne({ batch: b._id, trainer: req.user.id, dateKey: today, status: 'open' });
    const attendedCount = open ? await Attendance.countDocuments({ session: open._id }) : 0;
    return { ...b, classesTaken, openSession: open ? { _id: open._id, checkInTime: open.checkInTime, attendedCount } : null };
  }));
  res.json(result);
});

app.post('/api/sessions/checkin', verifyToken, async (req, res) => {
  if (!isTrainer(req)) return res.status(403).json({ message: 'Only trainers can check in' });
  try {
    const m = /^BQR:([a-f0-9]{24}):([a-f0-9]+)$/.exec(req.body.qrValue || '');
    if (!m) return res.status(400).json({ message: 'Invalid QR code' });
    const batch = await Batch.findById(m[1]);
    if (!batch || batch.qrToken !== m[2]) return res.status(400).json({ message: 'QR code does not match any batch' });
    if (String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'This batch is not assigned to you' });

    const today = dateKeyOf();
    if (await ClassSession.findOne({ batch: batch._id, dateKey: today, status: 'open' })) {
      return res.status(400).json({ message: 'A session for this batch is already open today' });
    }
    const session = await ClassSession.create({
      batch: batch._id, trainer: req.user.id, dateKey: today,
      checkInTime: new Date(), status: 'open',
      currentToken: crypto.randomBytes(8).toString('hex'), tokenIssuedAt: new Date()
    });
    res.json({ message: `Checked in for ${batch.subject}`, sessionId: session._id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/sessions/checkout', verifyToken, async (req, res) => {
  if (!isTrainer(req)) return res.status(403).json({ message: 'Only trainers can check out' });
  try {
    const m = /^BQR:([a-f0-9]{24}):([a-f0-9]+)$/.exec(req.body.qrValue || '');
    if (!m) return res.status(400).json({ message: 'Invalid QR code' });
    const batch = await Batch.findById(m[1]);
    if (!batch || batch.qrToken !== m[2]) return res.status(400).json({ message: 'QR code does not match any batch' });

    const session = await ClassSession.findOne({ batch: batch._id, trainer: req.user.id, dateKey: dateKeyOf(), status: 'open' });
    if (!session) return res.status(400).json({ message: 'No open session found for this batch' });
    session.checkOutTime = new Date();
    session.status = 'closed';
    await session.save();
    const attendedCount = await Attendance.countDocuments({ session: session._id });
    res.json({ message: `Checked out. ${attendedCount} student(s) marked present.` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/sessions/:id/qr-token', verifyToken, async (req, res) => {
  if (!isTrainer(req)) return res.status(403).json({ message: 'Access denied' });
  const session = await ClassSession.findById(req.params.id);
  if (!session || String(session.trainer) !== req.user.id) return res.status(404).json({ message: 'Session not found' });
  if (session.status !== 'open') return res.status(400).json({ message: 'Session is closed' });

  if (!session.tokenIssuedAt || Date.now() - session.tokenIssuedAt.getTime() > 25000) {
    session.currentToken = crypto.randomBytes(8).toString('hex');
    session.tokenIssuedAt = new Date();
    await session.save();
  }
  const attendedCount = await Attendance.countDocuments({ session: session._id });
  res.json({ qrValue: `SQR:${session._id}:${session.currentToken}`, attendedCount });
});

app.post('/api/attendance/mark', verifyToken, async (req, res) => {
  try {
    const m = /^SQR:([a-f0-9]{24}):([a-f0-9]+)$/.exec(req.body.qrValue || '');
    if (!m) return res.status(400).json({ message: 'Invalid QR code' });
    const session = await ClassSession.findById(m[1]).populate('batch', 'subject batchCode');
    if (!session || session.status !== 'open') return res.status(400).json({ message: 'This class is not currently active' });
    if (session.currentToken !== m[2]) return res.status(400).json({ message: 'QR code expired — ask your trainer to refresh it' });
    if (await Attendance.findOne({ session: session._id, student: req.user.id })) {
      return res.status(400).json({ message: 'You have already marked attendance for this class' });
    }
    await Attendance.create({ session: session._id, student: req.user.id });
    await BatchMember.updateOne(
      { batch: session.batch._id, student: req.user.id },
      { $setOnInsert: { joinedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: `Attendance marked for ${session.batch.subject} (${session.batch.batchCode})` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/attendance/mine', verifyToken, async (req, res) => {
  const records = await Attendance.find({ student: req.user.id })
    .populate({ path: 'session', populate: { path: 'batch', select: 'subject batchCode venue' } })
    .sort({ markedAt: -1 });
  res.json(records.filter((r) => r.session).map((r) => ({
    subject: r.session.batch?.subject, batchCode: r.session.batch?.batchCode,
    venue: r.session.batch?.venue, markedAt: r.markedAt, date: r.session.dateKey
  })));
});

app.get('/api/attendance/sessions', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  const sessions = await ClassSession.find().populate('batch', 'subject batchCode venue').populate('trainer', 'name email').sort({ createdAt: -1 }).limit(200).lean();
  const withCounts = await Promise.all(sessions.map(async (s) => ({ ...s, attendedCount: await Attendance.countDocuments({ session: s._id }) })));
  res.json(withCounts);
});

app.get('/api/attendance/sessions/:id/students', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req) && !isTrainer(req)) return res.status(403).json({ message: 'Access denied' });
  const list = await Attendance.find({ session: req.params.id }).populate('student', 'name email').sort({ markedAt: 1 });
  res.json(list.map((a) => ({ name: a.student?.name, email: a.student?.email, markedAt: a.markedAt })));
});

app.get('/api/batches/:id/students', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });

  const sessionIds = (await ClassSession.find({ batch: batch._id }).select('_id')).map((s) => s._id);
  const studentIds = await Attendance.find({ session: { $in: sessionIds } }).distinct('student');
  res.json(await User.find({ _id: { $in: studentIds } }).select('name email'));
});

app.put('/api/staff/batches/change-student', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const { studentId, oldBatchId, newBatchId } = req.body;
    if (!studentId || !oldBatchId || !newBatchId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await BatchMember.deleteOne({ student: studentId, batch: oldBatchId });
    await BatchMember.updateOne(
      { student: studentId, batch: newBatchId },
      { $setOnInsert: { joinedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Student successfully moved to the new batch' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/batches/:id/sessions', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  const sessions = await ClassSession.find({ batch: batch._id }).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(sessions.map(async (s) => ({ ...s, attendedCount: await Attendance.countDocuments({ session: s._id }) })));
  res.json(withCounts);
});

app.post('/api/mock-ratings', verifyToken, async (req, res) => {
  if (!isTrainer(req)) return res.status(403).json({ message: 'Only trainers can give mock ratings' });
  try {
    const { batchId, studentId, technicalRating, communicationRating, codingRating, remarks } = req.body;
    const batch = await Batch.findById(batchId);
    if (!batch || String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
    const rating = await MockRating.create({ batch: batchId, trainer: req.user.id, student: studentId, technicalRating, communicationRating, codingRating, remarks });
    res.status(201).json(rating);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.get('/api/mock-ratings/batch/:id', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  res.json(await MockRating.find({ batch: batch._id }).populate('student', 'name email').sort({ createdAt: -1 }));
});

const r1 = (n) => Math.round((n || 0) * 10) / 10;

app.get('/api/mock-ratings/mine', verifyToken, async (req, res) => {
  const list = await MockRating.find({ student: req.user.id }).populate('batch', 'subject batchCode').sort({ createdAt: -1 });
  const grouped = {};
  list.forEach((r) => {
    const key = String(r.batch._id);
    if (!grouped[key]) grouped[key] = { batch: r.batch, mocks: [], count: 0, sumT: 0, sumC: 0, sumCo: 0 };
    const g = grouped[key];
    g.mocks.push({ date: r.createdAt, technicalRating: r.technicalRating, communicationRating: r.communicationRating, codingRating: r.codingRating, remarks: r.remarks });
    g.count++; g.sumT += r.technicalRating; g.sumC += r.communicationRating; g.sumCo += r.codingRating;
  });
  res.json(Object.values(grouped).map((g) => ({
    batch: g.batch, mocksAttended: g.count,
    avgTechnical: +(g.sumT / g.count).toFixed(1),
    avgCommunication: +(g.sumC / g.count).toFixed(1),
    avgCoding: +(g.sumCo / g.count).toFixed(1),
    mocks: g.mocks
  })));
});

app.get('/api/users/stats', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Access denied' });
  const [students, admins, trainers, superadmins, pending] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'trainer' }),
    User.countDocuments({ role: 'superadmin' }),
    User.countDocuments({ status: 'pending' })
  ]);
  res.json({ students, admins, trainers, superadmins, pending });
});

app.get('/api/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  // 🚀 SPEED BOOST: Exclude heavy Base64 profilePic on bulk table loads + use .lean()
  res.json(await User.find(filter).select('-password -profilePic').sort({ createdAt: -1 }).lean());
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Access denied' });
  if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete a super admin account' });
  await target.deleteOne();
  res.json({ message: `${target.name} removed` });
});

const harness = require('./judgeHarness');
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const judge0Headers = process.env.JUDGE0_TOKEN ? { 'X-Auth-Token': process.env.JUDGE0_TOKEN } : {};
const LANG_IDS = { java: 62, python: 71, javascript: 63 };
const b64 = (s) => Buffer.from(s || '', 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log('🧪 Judge0 URL:', JUDGE0_URL);

const paramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  statementMd: { type: String, required: true },
  points: { type: Number, default: 100 },
  timeLimit: { type: Number, default: 2 },
  memoryLimit: { type: Number, default: 256000 },
  mode: { type: String, enum: ['stdin', 'function'], default: 'stdin' },
  functionName: { type: String, default: '' },
  returnType: { type: String, default: '' },
  params: { type: [paramSchema], default: [] },
  testCases: [
    {
      input: String,
      expectedOutput: String,
      isSample: { type: Boolean, default: false }
    }
  ],
  starterCode: {
    java: { type: String, default: '' },
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
    cpp: { type: String, default: '' },
    c: { type: String, default: '' },
    csharp: { type: String, default: '' }
  }
}, { timestamps: true });

const Problem = mongoose.model('Problem', problemSchema);

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  language: String,
  code: String,
  verdict: String,
  passed: Number,
  total: Number,
  score: Number,
  results: [{ status: String, time: String, memory: Number, isSample: Boolean }]
}, { timestamps: true });
const Submission = mongoose.model('Submission', submissionSchema);

const FENCE = '`'.repeat(3);
function extractCases(text, isSample) {
  const re = new RegExp(`###\\s*Input\\s*${FENCE}[^\\n]*\\n([\\s\\S]*?)${FENCE}\\s*###\\s*Output\\s*${FENCE}[^\\n]*\\n([\\s\\S]*?)${FENCE}`, 'g');
  const cases = [];
  let m;
  while ((m = re.exec(text)) !== null) cases.push({ input: m[1].trim(), expectedOutput: m[2].trim(), isSample });
  return cases;
}
function parseProblemMd(md) {
  const title = (md.match(/^#\s+(.+)$/m) || [])[1] || 'Untitled';
  const [beforeHidden, hiddenPart = ''] = md.split(/^##\s*Hidden Test Cases.*$/im);
  const [statement, samplePart = ''] = beforeHidden.split(/^##\s*Test Cases.*$/im);
  return {
    title: title.trim(),
    statementMd: statement.replace(/^#\s+.+\n?/, '').trim(),
    testCases: [...extractCases(samplePart, true), ...extractCases(hiddenPart, false)]
  };
}

let activeJobs = 0;
const waitingJobs = [];
const MAX_JOBS = Number(process.env.MAX_GRADING_JOBS) || 15;
const withSlot = async (fn) => {
  if (activeJobs >= MAX_JOBS) await new Promise((r) => waitingJobs.push(r));
  else activeJobs++;
  try { return await fn(); }
  finally {
    const next = waitingJobs.shift();
    if (next) next(); else activeJobs--;
  }
};

const lastRun = new Map();
const cooldown = (ms) => (req, res, next) => {
  const now = Date.now();
  if (now - (lastRun.get(req.user.id) || 0) < ms) return res.status(429).json({ message: 'Please wait a few seconds before running again.' });
  lastRun.set(req.user.id, now);
  next();
};

async function judgeBatch(problem, code, language, cases) {
  const cpuTime = Math.min(Number(problem.timeLimit) || 2, 15);
  const memory = Math.min(Number(problem.memoryLimit) || 256000, 512000);
  const isFn = problem.mode === 'function';
  const fnSpec = isFn ? harness.specOf(problem) : null;
  const paramTypes = isFn ? fnSpec.params.map((x) => x.type) : [];
  const source = isFn ? harness.buildSource(language, code, fnSpec) : code;

  const { data: created } = await axios.post(`${JUDGE0_URL}/submissions/batch?base64_encoded=true`, {
    submissions: cases.map((t) => {
      const sub = {
        source_code: b64(source), language_id: LANG_IDS[language],
        stdin: b64(isFn ? harness.buildStdin(t.input, paramTypes) : t.input),
        cpu_time_limit: cpuTime, memory_limit: memory
      };
      if (!isFn) sub.expected_output = b64(t.expectedOutput);
      return sub;
    })
  }, { headers: judge0Headers });

  if (!Array.isArray(created) || created.some((c) => !c.token)) {
    throw new Error('Judge0 rejected the submission: ' + JSON.stringify(created));
  }
  const tokens = created.map((c) => c.token).join(',');

  for (let i = 0; i < 60; i++) {
    await sleep(i < 5 ? 500 : 1000);
    const { data } = await axios.get(`${JUDGE0_URL}/submissions/batch`, {
      headers: judge0Headers,
      params: { tokens, base64_encoded: true, fields: 'token,status,time,memory,stdout,stderr,compile_output' }
    });
    if (data.submissions.every((s) => s.status.id > 2)) {
      return data.submissions.map((s, i) => {
        const r = {
          status: s.status.description, accepted: s.status.id === 3, time: s.time, memory: s.memory,
          stdout: unb64(s.stdout),
          stderr: unb64(s.stderr) || (s.status.id === 6 ? unb64(s.compile_output) : '')
        };
        return isFn ? checkFunctionResult(fnSpec, cases[i], r) : r;
      });
    }
  }
  throw new Error('Judge server timed out');
}

function checkFunctionResult(spec, testCase, r) {
  if (!r.accepted) return { ...r, printed: r.stdout, stdout: '' };
  const got = harness.readResult(r.stdout, spec.returnType);
  const out = { ...r, printed: got.printed || '', stdout: '' };
  if (!got.found || got.error) {
    return { ...out, accepted: false, status: 'Runtime Error', stderr: 'Your function did not return a value. Do not call exit() or stop the program yourself.' };
  }
  out.stdout = harness.display(got.value);
  let expected;
  try { expected = harness.parseExpected(testCase.expectedOutput, spec.returnType); }
  catch (e) { return { ...out, accepted: false, status: 'Test Case Error', stderr: e.message }; }
  if (!harness.valuesMatch(got.value, expected, spec.returnType)) return { ...out, accepted: false, status: 'Wrong Answer' };
  return out;
}

const EMPTY_STARTER = { java: '', python: '', javascript: '' };
const functionFields = (body, testCases) => {
  if (body.mode !== 'function') {
    return { fields: { mode: 'stdin', functionName: '', returnType: '', params: [] } };
  }
  const spec = {
    functionName: String(body.functionName || '').trim(),
    returnType: body.returnType,
    params: (Array.isArray(body.params) ? body.params : []).map((x) => ({ name: String(x.name || '').trim(), type: x.type }))
  };
  const error = harness.validateSignature(spec) || harness.validateTestCases({ ...spec, testCases });
  if (error) return { error };
  return { fields: { mode: 'function', ...spec, starterCode: EMPTY_STARTER } };
};

const runCases = (problem, code, language, cases) =>
  withSlot(async () => {
    const out = [];
    for (let i = 0; i < cases.length; i += 20) out.push(...(await judgeBatch(problem, code, language, cases.slice(i, i + 20))));
    return out;
  });

const judgeErrorMessage = (e) => {
  const d = e.response?.data;
  if (e.response) console.error('Judge0 error:', e.response.status, JSON.stringify(d));
  else console.error('Compiler error:', e.message);
  const detail = d ? (typeof d === 'string' ? d : JSON.stringify(d)) : '';
  return 'Compiler service error: ' + e.message + (detail ? ' - ' + detail : '');
};

app.post('/api/problems', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { title, difficulty, points, timeLimit, statementMd, testCases, starterCode } = req.body;
    if (!title?.trim() || !statementMd?.trim()) return res.status(400).json({ message: 'Title and statement are required' });
    if (!Array.isArray(testCases) || testCases.length === 0) return res.status(400).json({ message: 'Add at least one test case' });
    const fn = functionFields(req.body, testCases);
    if (fn.error) return res.status(400).json({ message: fn.error });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const problem = await Problem.create({
      title, slug, difficulty: difficulty || 'Easy', points: Number(points) || 100,
      timeLimit: Number(timeLimit) || 2, statementMd, testCases, starterCode, ...fn.fields
    });
    res.status(201).json(problem);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/problems/upload', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { mdText, difficulty, points, timeLimit } = req.body;
    const parsed = parseProblemMd(mdText || '');
    if (!parsed.testCases.length) return res.status(400).json({ message: 'No test cases found in the .md file' });
    const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const problem = await Problem.create({ ...parsed, slug, difficulty: difficulty || 'Easy', points: Number(points) || 100, timeLimit: Number(timeLimit) || 2 });
    res.status(201).json({ _id: problem._id, title: problem.title, tests: problem.testCases.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// app.get('/api/problems/admin/submissions', verifyToken, async (req, res) => {
//   if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
//   const subs = await Submission.find().populate('user', 'name email').populate('problem', 'title points').sort({ createdAt: -1 }).limit(500);
//   res.json(subs);
// });

app.get('/api/problems/admin/submissions', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  
  try {
    // 1. Get all submissions sorted by oldest first (to calculate attempt order)
    const subs = await Submission.find()
      .populate('user', 'name email profilePic')
      .populate('problem', 'title points')
      .sort({ createdAt: 1 }) 
      .lean();

    // 2. Find batches for these students
    const studentIds = [...new Set(subs.map(s => String(s.user?._id)).filter(id => id !== 'undefined'))];
    const memberships = await BatchMember.find({ student: { $in: studentIds } })
      .populate('batch', 'batchCode subject')
      .lean();

    const batchMap = {};
    memberships.forEach(m => {
      if (m.batch) {
        const sId = String(m.student);
        if (!batchMap[sId]) batchMap[sId] = [];
        batchMap[sId].push(`${m.batch.subject} (${m.batch.batchCode})`);
      }
    });

    // 3. Attach attempt counts & batches
    const userProblemCount = {};
    const enrichedSubs = subs.map(s => {
      const sId = String(s.user?._id);
      const pId = String(s.problem?._id);
      const key = `${sId}_${pId}`;
      
      userProblemCount[key] = (userProblemCount[key] || 0) + 1;
      
      return {
        ...s,
        attemptNumber: userProblemCount[key],
        studentBatches: batchMap[sId] || []
      };
    });

    // 4. Return newest first for the Admin UI
    res.json(enrichedSubs.reverse());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.get('/api/problems/admin/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  const p = await Problem.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

app.put('/api/problems/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { title, difficulty, points, timeLimit, statementMd, testCases, starterCode } = req.body;
    if (!Array.isArray(testCases) || testCases.length === 0) return res.status(400).json({ message: 'Add at least one test case' });
    const fn = functionFields(req.body, testCases);
    if (fn.error) return res.status(400).json({ message: fn.error });
    const p = await Problem.findByIdAndUpdate(req.params.id,
      { title, difficulty, points: Number(points) || 100, timeLimit: Number(timeLimit) || 2, statementMd, testCases, starterCode, ...fn.fields },
      { returnDocument: 'after', runValidators: true });
    res.json(p);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.delete('/api/problems/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  await Problem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/problems', verifyToken, async (req, res) => {
  try {
    const problems = await Problem.find().select('title slug difficulty points testCases').sort({ createdAt: -1 });
    const best = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$problem', best: { $max: '$score' }, attempts: { $sum: 1 } } }
    ]);
    const map = {};
    best.forEach((b) => { map[String(b._id)] = b; });
    const admin = isAdminOrSuper(req);
    res.json(problems.map((p) => {
      const o = p.toObject();
      const counts = admin ? { testCaseCount: o.testCases.length, hiddenCount: o.testCases.filter((t) => !t.isSample).length } : {};
      delete o.testCases;
      return { ...o, ...counts, bestScore: map[String(p._id)]?.best ?? null, attempts: map[String(p._id)]?.attempts ?? 0 };
    }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/problems/me/submissions', verifyToken, async (req, res) => {
  const subs = await Submission.find({ user: req.user.id }).populate('problem', 'title points').select('-code').sort({ createdAt: -1 });
  res.json(subs);
});

app.get('/api/problems/:slug', verifyToken, async (req, res) => {
  const p = await Problem.findOne({ slug: req.params.slug });
  if (!p) return res.status(404).json({ message: 'Not found' });
  const obj = p.toObject();
  obj.testCases = obj.testCases.filter((t) => t.isSample);
  if (p.mode === 'function') obj.starterCode = harness.starterCode(harness.specOf(p));
  res.json(obj);
});

app.post('/api/problems/:slug/run', verifyToken, cooldown(3000), async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!LANG_IDS[language]) return res.status(400).json({ message: 'Unsupported language' });
    const p = await Problem.findOne({ slug: req.params.slug });
    if (!p) return res.status(404).json({ message: 'Not found' });
    const samples = p.testCases.filter((t) => t.isSample);
    const results = await runCases(p, code, language, samples);
    res.json(results.map((r, i) => ({ ...r, input: samples[i].input, expected: samples[i].expectedOutput })));
  } catch (e) {
    res.status(500).json({ message: judgeErrorMessage(e) });
  }
});

app.post('/api/problems/:slug/submit', verifyToken, cooldown(5000), async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!LANG_IDS[language]) return res.status(400).json({ message: 'Unsupported language' });
    const p = await Problem.findOne({ slug: req.params.slug });
    if (!p) return res.status(404).json({ message: 'Not found' });

    const results = await runCases(p, code, language, p.testCases);
    const passed = results.filter((r) => r.accepted).length;
    const total = results.length;
    const firstFail = results.find((r) => !r.accepted);
    const sub = await Submission.create({
      user: req.user.id, problem: p._id, language, code,
      verdict: firstFail ? firstFail.status : 'Accepted',
      passed, total, score: Math.round((passed / total) * p.points),
      results: results.map((r, i) => ({ status: r.status, time: r.time, memory: r.memory, isSample: p.testCases[i].isSample }))
    });

    const cases = results.map((r, i) => {
      const tc = p.testCases[i];
      const base = { n: i + 1, hidden: !tc.isSample, accepted: r.accepted, status: r.status, time: r.time };
      if (!tc.isSample) return base;
      return { ...base, input: tc.input, expected: tc.expectedOutput, stdout: r.stdout, printed: r.printed || '', stderr: r.stderr };
    });
    const compileFail = results.find((r) => r.status === 'Compilation Error');
    res.json({ verdict: sub.verdict, passed, total, score: sub.score, points: p.points, cases, compileError: compileFail ? compileFail.stderr : '' });
  } catch (e) {
    res.status(500).json({ message: judgeErrorMessage(e) });
  }
});

const appUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX, files: 2 }
}).fields([{ name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }]);

const checkJobEligibility = (j, p) => {
  const reasons = [];
  if (!p.highestQualification || !p.highestQualification.toLowerCase().includes(String(j.reqQualification).toLowerCase())) {
    reasons.push(`Qualification mismatch. Required: ${j.reqQualification}`);
  }
  if (String(p.passingYear) !== String(j.reqPassingYear)) reasons.push(`Passing year mismatch. Required: ${j.reqPassingYear}`);
  if (!(Number(p.percentage) >= Number(j.reqMinPercentage))) reasons.push(`Percentage too low. Required: ${j.reqMinPercentage}%`);
  
  // REMOVED EMPLOYABILITY SCORE CHECK HERE

  if (Number(p.backlogs || 0) > Number(j.reqMaxBacklogs)) reasons.push(`Too many active backlogs. Allowed: ${j.reqMaxBacklogs}`);
  if (Number(p.educationGap || 0) > Number(j.reqMaxEducationGap)) reasons.push(`Education gap too large. Allowed: ${j.reqMaxEducationGap} years`);
  return reasons;
};

app.post('/api/jobs/:id/apply', verifyToken, (req, res) => {
  appUpload(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ message: uploadErr.message });
    const savedIds = [];
    try {
      if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can apply' });
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      const student = await User.findById(req.user.id).select('-password');
      const reasons = checkJobEligibility(job, student);
      if (reasons.length) return res.status(403).json({ message: 'Not eligible', reasons });

      if (await Application.findOne({ student: student._id, job: job._id })) {
        return res.status(400).json({ message: 'Already applied' });
      }

      const email = String(req.body.email || '').trim();
      const phone = String(req.body.phone || '').trim();
      const parentPhone = String(req.body.parentPhone || '').trim();
      const linkedin = String(req.body.linkedin || '').trim();
      const github = String(req.body.github || '').trim();

      const photo = req.files?.photo?.[0];
      const resume = req.files?.resume?.[0];
      if (!photo) return res.status(400).json({ message: 'Upload photo' });
      if (!resume) return res.status(400).json({ message: 'Upload resume' });

      const photoFileId = await saveToGridFS(photo, 'photo'); savedIds.push(photoFileId);
      const resumeFileId = await saveToGridFS(resume, 'resume'); savedIds.push(resumeFileId);

      const doc = await Application.create({
        student: student._id, job: job._id, email, phone, parentPhone, linkedin, github,
        photoFileId, resumeFileId, history: [{ status: 'Applied', roundNo: 1, changedBy: 'Student' }]
      });

      res.status(201).json({ message: 'Application submitted', application: doc });
    } catch (e) {
      await Promise.all(savedIds.map(deleteGridFile));
      res.status(500).json({ message: e.message });
    }
  });
});

app.get('/api/jobs/:id/my-application', verifyToken, async (req, res) => {
  try {
    const a = await Application.findOne({ student: req.user.id, job: req.params.id }).select('status roundNo interviewDate createdAt');
    res.json(a || null);
  } catch (e) { res.status(400).json({ message: 'Invalid job id' }); }
});

app.get('/api/applications/mine', verifyToken, async (req, res) => {
  try {
    const list = await Application.find({ student: req.user.id })
      .populate('job', 'jobId title location')
      .select('job status roundNo interviewDate createdAt history').sort({ createdAt: -1 }).lean();
    const counts = Object.fromEntries(APP_STATUSES.map((s) => [s, 0]));
    const applications = list.filter((a) => a.job).map((a) => {
        counts[a.status]++;
        return { ...a, appliedAt: a.createdAt };
    });
    res.json({ statuses: APP_STATUSES, total: applications.length, counts, applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/files/:id', verifyToken, async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const owner = await Application.findOne({ $or: [{ photoFileId: id }, { resumeFileId: id }] }).select('student');
    if (!owner) return res.status(404).json({ message: 'File not found' });
    if (!isAdminOrSuper(req) && String(owner.student) !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const files = await getBucket().find({ _id: id }).toArray();
    if (!files.length) return res.status(404).json({ message: 'File not found' });

    res.set('Content-Type', files[0].contentType || 'application/octet-stream');
    res.set('Cache-Control', 'private, max-age=3600');
    getBucket().openDownloadStream(id).on('error', () => res.end()).pipe(res);
  } catch (e) { res.status(404).json({ message: 'File not found' }); }
});

app.get('/api/applications/summary', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const [jobs, apps] = await Promise.all([
      Job.find().select('jobId title lastDateToApply status').sort({ datePosted: -1 }).lean(),
      Application.find().populate('student', 'name email').select('student job status').lean()
    ]);
    const emptyCounts = () => Object.fromEntries(APP_STATUSES.map((s) => [s, 0]));

    const byJob = new Map(jobs.map((j) => [String(j._id), { job: j, counts: emptyCounts(), total: 0 }]));
    const byStudent = new Map();

    apps.forEach((a) => {
      const jobRow = byJob.get(String(a.job));
      if (jobRow) { jobRow.counts[a.status]++; jobRow.total++; }
      if (!a.student) return;
      const key = String(a.student._id);
      if (!byStudent.has(key)) byStudent.set(key, { student: a.student, counts: emptyCounts(), total: 0, applications: [] });
      const row = byStudent.get(key);
      row.counts[a.status]++;
      row.total++;
      row.applications.push({ jobId: jobRow?.job.jobId, title: jobRow?.job.title, status: a.status });
    });

    res.json({ statuses: APP_STATUSES, byJob: [...byJob.values()], byStudent: [...byStudent.values()].sort((x, y) => y.total - x.total) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/jobs/:id/applications', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const list = await Application.find({ job: req.params.id })
      .populate('student', 'name email highestQualification passingYear percentage backlogs educationGap skillsAcquired employabilityScore')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) { res.status(400).json({ message: 'Invalid job id' }); }
});

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const APP_URL = process.env.FRONTEND_URL || 'https://destinationcareer.ashishchauhanvasai.workers.dev';

app.put('/api/applications/:id/status', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { status, roundNo, interviewDate, remarks, message } = req.body;
    const a = await Application.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Application not found' });
    const before = { status: a.status, roundNo: a.roundNo, interviewDate: a.interviewDate };

    if (status !== undefined) a.status = status;
    if (roundNo !== undefined) a.roundNo = Math.max(1, Math.min(Number(roundNo) || 1, 20));
    if (interviewDate !== undefined) a.interviewDate = String(interviewDate).slice(0, 100);
    if (remarks !== undefined) a.remarks = String(remarks).slice(0, 1000);

    const msg = String(message || '').trim().slice(0, 500);
    const changed = a.status !== before.status || a.roundNo !== before.roundNo || a.interviewDate !== before.interviewDate || Boolean(msg);

    if (changed) {
      if (!a.history || a.history.length === 0) {
        a.history.push({ status: 'Applied', roundNo: 1, changedBy: 'Student', changedAt: a.createdAt });
      }
      const admin = await User.findById(req.user.id).select('name');
      a.history.push({
        status: a.status, roundNo: a.roundNo, interviewDate: a.interviewDate,
        message: msg, changedBy: admin?.name || 'Admin'
      });
    }

    await a.save();

    if (changed) {
      const [student, job] = await Promise.all([
        User.findById(a.student).select('name email'),
        Job.findById(a.job).select('title jobId')
      ]);
      const to = a.email || student?.email;
      if (to && job) {
        const showRound = a.status === 'Interview Scheduled' || a.status === 'Next Round';
        transporter.sendMail({
          from: `"Destination Career" <${EMAIL_USER}>`,
          to,
          subject: `Update on your application: ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
              <h2 style="color: #2563eb;">Application update</h2>
              <p>Hi <strong>${escapeHtml(student?.name || 'there')}</strong>,</p>
              <p>There is an update on your application for <strong>${escapeHtml(job.title)}</strong> (${escapeHtml(job.jobId)}).</p>
              <p style="font-size: 18px;">Status: <strong>${escapeHtml(a.status)}</strong></p>
              ${showRound ? `<p>Round ${a.roundNo}${a.interviewDate ? `, ${escapeHtml(a.interviewDate)}` : ''}</p>` : ''}
              ${msg ? `<p style="background:#f3f4f6;padding:12px;border-radius:8px;">${escapeHtml(msg)}</p>` : ''}
              <a href="${APP_URL}/my-applications" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">View my applications</a>
            </div>
          `
        }, (err) => { if (err) console.error('Application update email failed:', err); });
      }
    }

    res.json({ message: 'Updated', status: a.status, notified: changed });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

app.get('/api/applications/export', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const filter = req.query.jobId ? { job: req.query.jobId } : {};
    const apps = await Application.find(filter)
      .populate('student', 'name highestQualification passingYear percentage backlogs educationGap skillsAcquired')
      .populate('job', 'jobId title')
      .sort({ createdAt: -1 }).lean();

    const header = ['Job ID', 'Job Title', 'Student Name', 'Email', 'Contact Number', 'Parent Contact Number',
      'LinkedIn', 'GitHub', 'Qualification', 'Passing Year', 'Percentage', 'Backlogs', 'Education Gap',
      'Skills', 'Status', 'Round', 'Interview Date', 'Remarks', 'Applied On'];

    const rows = apps.map((a) => [
      a.job?.jobId, a.job?.title, a.student?.name, a.email, a.phone, a.parentPhone,
      a.linkedin, a.github, a.student?.highestQualification, a.student?.passingYear, a.student?.percentage,
      a.student?.backlogs, a.student?.educationGap, a.student?.skillsAcquired,
      a.status, a.roundNo, a.interviewDate, a.remarks, new Date(a.createdAt).toISOString().slice(0, 10)
    ]);

    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="applications.csv"');
    res.send(csv);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

const DOMAINS = ['Java', 'Python', 'Data Analytics', 'Frontend'];

app.get('/api/trainers/overview', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  res.json(await User.find({ role: 'trainer' }).select('name email status domain').sort({ name: 1 }));
});

app.put('/api/trainers/:id/domain', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Only super admin can set a trainer domain' });
  try {
    const { domain } = req.body;
    if (!['', ...DOMAINS].includes(domain)) return res.status(400).json({ message: 'Invalid domain' });
    const t = await User.findOneAndUpdate({ _id: req.params.id, role: 'trainer' }, { domain }, { returnDocument: 'after' })
      .select('name email domain');
    if (!t) return res.status(404).json({ message: 'Trainer not found' });
    res.json(t);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// =========================================================
// TOP PERFORMERS API (Trainer, Admin & Superadmin)
// =========================================================

app.get('/api/trainer/performers', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  
  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    const performers = await TopPerformer.find().sort({ createdAt: -1 });
    return res.json({ domain: 'All', performers });
  } else {
    const trainer = await User.findById(req.user.id);
    if (!trainer.domain) return res.json({ domain: '', performers: [] });
    const performers = await TopPerformer.find({ category: trainer.domain }).sort({ createdAt: -1 });
    res.json({ domain: trainer.domain, performers });
  }
});

app.get('/api/trainer/search-students', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  
  const { q } = req.query;
  if (!q) return res.json([]);

  const students = await User.find({ 
    role: 'student',
    $or: [
      { name: { $regex: q,$options: 'i' } },
      { email: { $regex: q,$options: 'i' } }
    ]
  }).select('name email profilePic').limit(10);
  
  res.json(students);
});

app.post('/api/trainer/performers', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  
  const { studentName, metric, imageUrl, category } = req.body;
  let finalCategory = category;
  
  if (req.user.role === 'trainer') {
    const trainer = await User.findById(req.user.id);
    if (!trainer.domain) return res.status(400).json({ message: 'Your domain is not set' });
    finalCategory = trainer.domain;
  }

  if (!finalCategory) return res.status(400).json({ message: 'Category/Domain is required' });

  const p = new TopPerformer({ category: finalCategory, studentName, metric, imageUrl, addedBy: req.user.id });
  await p.save();
  res.json(p);
});

app.put('/api/trainer/performers/:id', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  const p = await TopPerformer.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  res.json(p);
});

app.delete('/api/trainer/performers/:id', verifyToken, async (req, res) => {
  if (!['trainer', 'admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  await TopPerformer.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});


// =========================================================
// ATTENDANCE CALENDAR MATRIX (Admin/Trainer)
// =========================================================
app.get('/api/staff/batches/:id/attendance-matrix', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'trainer'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  
  try {
    const batchId = req.params.id;
    const studentIds = await BatchMember.distinct('student', { batch: batchId });
    const students = await User.find({ _id: { $in: studentIds } })
      .select('name email profilePic')
      .sort({ name: 1 })
      .lean();
    
    // FIX HERE: sort({ checkInTime: -1 }) makes the newest dates appear first (on the left)
    const sessions = await ClassSession.find({ batch: batchId }).sort({ checkInTime: -1 }).lean();
    
    const formattedSessions = sessions.map(s => ({
        _id: s._id,
        date: s.dateKey || s.checkInTime 
    }));
    
    const sessionIds = sessions.map(s => s._id);
    const attendanceRecords = await Attendance.find({ session: { $in: sessionIds } }).lean();
    
    const attMap = {};
    attendanceRecords.forEach(a => {
        attMap[`${a.student}_${a.session}`] = true;
    });

    res.json({ sessions: formattedSessions, students, attMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// =========================================================
// TOGGLE ATTENDANCE MANUAL CHECKBOX
// =========================================================
app.post('/api/staff/batches/:id/attendance/toggle', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'trainer'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  
  try {
    const { sessionId, studentId, isPresent } = req.body;

    if (isPresent) {
      await Attendance.updateOne(
        { session: sessionId, student: studentId },
        { $setOnInsert: { markedAt: new Date() } },
        { upsert: true }
      );
    } else {
      await Attendance.deleteOne({ session: sessionId, student: studentId });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Attendance Toggle Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// ASSIGNMENTS V2
// =========================================================

const isAssignmentOwner = (req, a) =>
  isAdminOrSuper(req) || (isTrainer(req) && a.createdBy && String(a.createdBy) === req.user.id);

const readAudience = async (req, body) => {
  const ids = Array.isArray(body.batchIds) ? body.batchIds.filter((x) => mongoose.isValidObjectId(x)) : [];
  const uniqueCount = new Set(ids.map(String)).size;

  if (isTrainer(req)) {
    if (!uniqueCount) return { error: 'Choose at least one of your batches' };
    const mine = await Batch.find({ _id: { $in: ids }, trainer: req.user.id }).distinct('_id');
    if (mine.length !== uniqueCount) return { error: 'You can only choose your own batches' };
    return { audience: 'batches', batches: mine };
  }

  if (body.audience === 'batches') {
    if (!uniqueCount) return { error: 'Choose at least one batch' };
    const found = await Batch.find({ _id: { $in: ids } }).distinct('_id');
    if (found.length !== uniqueCount) return { error: 'One of the selected batches does not exist' };
    return { audience: 'batches', batches: found };
  }
  return { audience: 'everyone', batches: [] };
};

const studentCanOpen = async (req, a) => {
  if (a.audience !== 'batches') return true;
  const myBatches = await BatchMember.distinct('batch', { student: req.user.id });
  return (a.batches || []).some((b) => myBatches.some((x) => String(x) === String(b)));
};

app.post('/api/assignments', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { title, level, description, topics } = req.body;
    const aud = await readAudience(req, req.body);
    if (aud.error) return res.status(400).json({ message: aud.error });
    const me = await User.findById(req.user.id).select('name');
    const a = await Assignment.create({
      title, level, description, topics,
      audience: aud.audience, batches: aud.batches,
      createdBy: req.user.id, createdByName: me?.name || ''
    });
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/assignments/:id', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const existing = await Assignment.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    if (!isAssignmentOwner(req, existing)) return res.status(403).json({ message: 'You can only edit your own assignments' });
    const { title, level, description, topics } = req.body;
    const aud = await readAudience(req, req.body);
    if (aud.error) return res.status(400).json({ message: aud.error });
    const a = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, level, description, topics, audience: aud.audience, batches: aud.batches },
      { returnDocument: 'after', runValidators: true }
    );
    res.json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.delete('/api/assignments/:id', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (!isAssignmentOwner(req, a)) return res.status(403).json({ message: 'You can only delete your own assignments' });
    const imageIds = a.topics.flatMap((t) => t.questions.flatMap((q) => q.images));
    await AssignmentImage.deleteMany({ _id: { $in: imageIds } });
    await AssignmentAnswer.deleteMany({ assignment: a._id });
    await a.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments/:id/review', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (!isAssignmentOwner(req, a)) return res.status(403).json({ message: 'You can only review your own assignments' });
    const qMap = {};
    a.topics.forEach((t) => t.questions.forEach((q) => {
      qMap[String(q._id)] = { text: q.text, marks: q.marks, qType: q.qType, topic: t.topicName, images: q.images };
    }));
    const answers = await AssignmentAnswer.find({ assignment: a._id })
      .populate('user', 'name email').sort({ updatedAt: -1 }).lean();
    res.json({
      title: a.title,
      answers: answers.map((x) => ({ ...x, question: qMap[String(x.questionId)] || null }))
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/assignment-answers/:id/grade', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const ans = await AssignmentAnswer.findById(req.params.id);
    if (!ans) return res.status(404).json({ message: 'Not found' });
    const a = await Assignment.findById(ans.assignment);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    if (!isAssignmentOwner(req, a)) return res.status(403).json({ message: 'You can only grade your own assignments' });
    const q = findQuestion(a, ans.questionId);
    const max = q ? q.marks : Infinity;
    ans.marks = Math.max(0, Math.min(Number(req.body.marks) || 0, max));
    ans.feedback = req.body.feedback || '';
    ans.graded = true;
    await ans.save();
    res.json({ message: 'Graded' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments', verifyToken, async (req, res) => {
  try {
    const staff = isAdminOrSuper(req) || isTrainer(req);
    let list;
    if (isAdminOrSuper(req)) {
      list = await Assignment.find().sort({ createdAt: -1 }).lean();
    } else if (isTrainer(req)) {
      list = await Assignment.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).lean();
    } else {
      const myBatches = await BatchMember.distinct('batch', { student: req.user.id });
      list = await Assignment.find({ $or: [{ audience: { $ne: 'batches' } }, { batches: {$in: myBatches } }] })
        .sort({ createdAt: -1 }).lean();
    }

    const mine = await AssignmentAnswer.find({ user: req.user.id }).select('assignment marks graded').lean();
    const stats = {};
    mine.forEach((x) => {
      const k = String(x.assignment);
      stats[k] = stats[k] || { answered: 0, marks: 0, pending: 0 };
      stats[k].answered++;
      stats[k].marks += x.marks || 0;
      if (!x.graded) stats[k].pending++;
    });

    let labelMap = {};
    if (staff) {
      const batchIds = [...new Set(list.flatMap((a) => (a.batches || []).map(String)))];
      const batchDocs = await Batch.find({ _id: { $in: batchIds } }).select('batchCode subject').lean();
      labelMap = Object.fromEntries(batchDocs.map((b) => [String(b._id), `${b.subject} (${b.batchCode})`]));
    }

    res.json(list.map((a) => {
      const qs = a.topics.flatMap((t) => t.questions);
      const s = stats[String(a._id)] || { answered: 0, marks: 0, pending: 0 };
      return {
        _id: a._id, title: a.title, level: a.level, description: a.description,
        modules: a.topics.length,
        questions: qs.length,
        totalMarks: qs.reduce((sum, q) => sum + (q.marks || 0), 0),
        answered: s.answered, marks: s.marks, pending: s.pending,
        ...(staff ? {
          audience: a.audience || 'everyone',
          batchLabels: (a.batches || []).map((b) => labelMap[String(b)]).filter(Boolean),
          createdByName: a.createdByName || ''
        } : {})
      };
    }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments/:id', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ message: 'Not found' });

    if (isAdminOrSuper(req)) {
      // full details
    } else if (isTrainer(req)) {
      if (!isAssignmentOwner(req, a)) return res.status(403).json({ message: 'You can only open your own assignments' });
    } else {
      if (!(await studentCanOpen(req, a))) return res.status(403).json({ message: 'This assignment is not for your batch' });
      a.topics.forEach((t) => t.questions.forEach((q) => { delete q.correctIndex; delete q.explanation; }));
    }
    res.json(a);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments/:id/my-answers', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'student' && !(await studentCanOpen(req, a))) {
      return res.status(403).json({ message: 'This assignment is not for your batch' });
    }
    const answers = await AssignmentAnswer.find({ user: req.user.id, assignment: a._id });
    res.json(answers.map((ans) => answerView(ans, findQuestion(a, ans.questionId))));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/assignments/:id/questions/:qid/answer', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'student' && !(await studentCanOpen(req, a))) {
      return res.status(403).json({ message: 'This assignment is not for your batch' });
    }
    const q = findQuestion(a, req.params.qid);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    const existing = await AssignmentAnswer.findOne({ user: req.user.id, questionId: q._id });

    if (q.qType === 'MCQ') {
      if (existing) return res.status(400).json({ message: 'You have already answered this question' });
      const sel = Number(req.body.selectedIndex);
      if (!Number.isInteger(sel) || sel < 0 || sel >= q.options.length) {
        return res.status(400).json({ message: 'Choose an option' });
      }
      const ok = sel === q.correctIndex;
      const ans = await AssignmentAnswer.create({
        user: req.user.id, assignment: a._id, questionId: q._id,
        selectedIndex: sel, isCorrect: ok, marks: ok ? q.marks : 0, graded: true
      });
      return res.json(answerView(ans, q));
    }

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write your answer first' });
    if (text.length > 20000) return res.status(400).json({ message: 'Answer is too long' });
    if (existing && existing.graded) return res.status(400).json({ message: 'This answer is already graded' });
    const ans = await AssignmentAnswer.findOneAndUpdate(
      { user: req.user.id, questionId: q._id },
      { $set: { assignment: a._id, text, graded: false, marks: 0, feedback: '' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    res.json(answerView(ans, q));
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// ============================================================================
// BATCH MEMBERS + STAFF TRACKING (admin / super admin / trainer)
// ============================================================================
const batchMemberSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now }
});
batchMemberSchema.index({ batch: 1, student: 1 }, { unique: true });
const BatchMember = mongoose.model('BatchMember', batchMemberSchema);

const isStaff = (req) => isAdminOrSuper(req) || isTrainer(req);
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istDay = (d) => new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const getAccessibleBatch = async (req, res, batchId) => {
  if (!mongoose.isValidObjectId(batchId)) { res.status(400).json({ message: 'Invalid batch id' }); return null; }
  const batch = await Batch.findById(batchId);
  if (!batch) { res.status(404).json({ message: 'Batch not found' }); return null; }
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) { res.status(403).json({ message: 'Not your batch' }); return null; }
  return batch;
};

// 1. List of batches
app.get('/api/staff/batches', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const filter = isTrainer(req) ? { trainer: req.user.id } : {};
    const batches = await Batch.find(filter).sort({ createdAt: -1 }).lean();
    const ids = batches.map((b) => b._id);

    const [members, sessions, mockRows] = await Promise.all([
      BatchMember.aggregate([{ $match: { batch: { $in: ids } } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]),
      ClassSession.aggregate([{ $match: { batch: { $in: ids } } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]),
      MockRating.find({ batch: { $in: ids } }).select('batch createdAt').lean()
    ]);
    const toMap = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x.n]));
    const memberMap = toMap(members);
    const sessionMap = toMap(sessions);

    const mockDays = {};
    mockRows.forEach((m) => {
      const k = String(m.batch);
      (mockDays[k] = mockDays[k] || new Set()).add(istDay(m.createdAt));
    });

    let unassignedCount = null;
    if (isAdminOrSuper(req)) {
      const memberIds = await BatchMember.distinct('student');
      unassignedCount = await User.countDocuments({ role: 'student', _id: { $nin: memberIds } });
    }

    res.json({
      unassignedCount,
      batches: batches.map((b) => ({
        _id: b._id, batchCode: b.batchCode, subject: b.subject, trainerName: b.trainerName, venue: b.venue,
        studentCount: memberMap[String(b._id)] || 0,
        classesTaken: sessionMap[String(b._id)] || 0,
        mocksTaken: mockDays[String(b._id)] ? mockDays[String(b._id)].size : 0
      }))
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// 2. Students of one batch
app.get('/api/staff/batches/:id/students', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    let batch = null;
    let studentIds;
    let totalClasses = 0;

    if (req.params.id === 'unassigned') {
      if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
      const memberIds = await BatchMember.distinct('student');
      studentIds = await User.find({ role: 'student', _id: { $nin: memberIds } }).distinct('_id');
    } else {
      batch = await getAccessibleBatch(req, res, req.params.id);
      if (!batch) return;
      studentIds = await BatchMember.distinct('student', { batch: batch._id });
      totalClasses = await ClassSession.countDocuments({ batch: batch._id });
    }

    const sessionIds = batch ? await ClassSession.distinct('_id', { batch: batch._id }) : [];
    const mockMatch = batch ? { batch: batch._id, student: { $in: studentIds } } : { student: { $in: studentIds } };

    const [students, attended, assignStats, mockStats] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('name email status profilePic').sort({ name: 1 }).lean(),
      batch
        ? Attendance.aggregate([
            { $match: { session: { $in: sessionIds }, student: { $in: studentIds } } },
            { $group: { _id: '$student', n: { $sum: 1 } } }
          ])
        : [],
      AssignmentAnswer.aggregate([
        { $match: { user: { $in: studentIds } } },
        { $group: { _id: '$user', answered: { $sum: 1 }, marks: { $sum: '$marks' }, pending: { $sum: { $cond: ['$graded', 0, 1] } } } }
      ]),
      MockRating.aggregate([
        { $match: mockMatch },
        { $group: { _id: '$student', n: { $sum: 1 }, tech: { $avg: '$technicalRating' }, comm: { $avg: '$communicationRating' }, code: { $avg: '$codingRating' } } }
      ])
    ]);

    const keyed = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x]));
    const attMap = keyed(attended);
    const asgMap = keyed(assignStats);
    const mockMap = keyed(mockStats);

    res.json({
      batch: batch ? { _id: batch._id, subject: batch.subject, batchCode: batch.batchCode, trainerName: batch.trainerName } : null,
      totalClasses,
      students: students.map((s) => {
        const k = String(s._id);
        return {
          _id: s._id, name: s.name, email: s.email, status: s.status, profilePic: s.profilePic,
          attended: attMap[k]?.n || 0,
          assignmentsAnswered: asgMap[k]?.answered || 0,
          assignmentMarks: asgMap[k]?.marks || 0,
          assignmentsPending: asgMap[k]?.pending || 0,
          mocks: mockMap[k]?.n || 0,
          avgTechnical: r1(mockMap[k]?.tech),
          avgCommunication: r1(mockMap[k]?.comm),
          avgCoding: r1(mockMap[k]?.code)
        };
      })
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// 3. Mock history of one batch
app.get('/api/staff/batches/:id/mocks', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const batch = await getAccessibleBatch(req, res, req.params.id);
    if (!batch) return;

    const ratings = await MockRating.find({ batch: batch._id })
      .populate('student', 'name email')
      .populate('trainer', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const byDay = new Map();
    ratings.forEach((r) => {
      const day = istDay(r.createdAt);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(r);
    });

    const avg = (list, key) => r1(list.reduce((s, x) => s + (x[key] || 0), 0) / (list.length || 1));
    const rounds = [...byDay.entries()].map(([date, list]) => ({
      date,
      count: list.length,
      avgTechnical: avg(list, 'technicalRating'),
      avgCommunication: avg(list, 'communicationRating'),
      avgCoding: avg(list, 'codingRating'),
      ratings: list.map((r) => ({
        _id: r._id,
        studentName: r.student?.name || 'Deleted user',
        studentEmail: r.student?.email || '',
        trainerName: r.trainer?.name || '',
        technicalRating: r.technicalRating,
        communicationRating: r.communicationRating,
        codingRating: r.codingRating,
        remarks: r.remarks
      }))
    }));

    res.json({
      batch: { _id: batch._id, subject: batch.subject, batchCode: batch.batchCode },
      totalMocks: rounds.length,
      rounds
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// 4. Full history of one student
app.get('/api/staff/students/:id/history', verifyToken, async (req, res) => {
  if (!isStaff(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid student id' });
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select('name email status highestQualification passingYear percentage backlogs educationGap skillsAcquired profilePic')
      .lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let memberships = await BatchMember.find({ student: student._id })
      .populate('batch', 'batchCode subject trainer trainerName')
      .lean();
    memberships = memberships.filter((m) => m.batch);

    let allowed = null; 
    if (isTrainer(req)) {
      memberships = memberships.filter((m) => String(m.batch.trainer) === req.user.id);
      if (memberships.length === 0) return res.status(403).json({ message: 'This student is not in your batches' });
      allowed = new Set(memberships.map((m) => String(m.batch._id)));
    }

    const attRows = await Attendance.find({ student: student._id })
      .populate({ path: 'session', select: 'batch dateKey', populate: { path: 'batch', select: 'batchCode subject' } })
      .sort({ markedAt: -1 })
      .lean();
    const attendance = attRows
      .filter((r) => r.session && r.session.batch && (!allowed || allowed.has(String(r.session.batch._id))))
      .map((r) => ({
        date: r.session.dateKey, subject: r.session.batch.subject,
        batchCode: r.session.batch.batchCode, batchId: String(r.session.batch._id), markedAt: r.markedAt
      }));

    const batches = await Promise.all(memberships.map(async (m) => ({
      _id: m.batch._id, batchCode: m.batch.batchCode, subject: m.batch.subject,
      trainerName: m.batch.trainerName, joinedAt: m.joinedAt,
      attended: attendance.filter((a) => a.batchId === String(m.batch._id)).length,
      totalClasses: await ClassSession.countDocuments({ batch: m.batch._id })
    })));

    const [assignments, answers] = await Promise.all([
      Assignment.find().select('title level topics').lean(),
      AssignmentAnswer.find({ user: student._id }).lean()
    ]);
    const assignmentList = assignments.map((a) => {
      const qs = a.topics.flatMap((t) => t.questions);
      const mine = answers.filter((x) => String(x.assignment) === String(a._id));
      return {
        _id: a._id, title: a.title, level: a.level,
        totalQuestions: qs.length,
        totalMarks: qs.reduce((s, q) => s + (q.marks || 0), 0),
        answered: mine.length,
        marks: mine.reduce((s, x) => s + (x.marks || 0), 0),
        pending: mine.filter((x) => !x.graded).length
      };
    });
    const assignmentSummary = {
      assigned: assignmentList.length,
      attempted: assignmentList.filter((a) => a.answered > 0).length,
      completed: assignmentList.filter((a) => a.totalQuestions > 0 && a.answered >= a.totalQuestions).length,
      marks: assignmentList.reduce((s, a) => s + a.marks, 0),
      totalMarks: assignmentList.reduce((s, a) => s + a.totalMarks, 0)
    };

    const mockFilter = { student: student._id };
    if (allowed) mockFilter.batch = { $in: memberships.map((m) => m.batch._id) };
    const mockRows = await MockRating.find(mockFilter)
      .populate('batch', 'subject batchCode')
      .populate('trainer', 'name')
      .sort({ createdAt: -1 })
      .lean();
    const mockAvg = (key) => r1(mockRows.reduce((s, x) => s + (x[key] || 0), 0) / (mockRows.length || 1));

    res.json({
      student, batches, attendance,
      assignments: { summary: assignmentSummary, list: assignmentList },
      mocks: {
        count: mockRows.length,
        avgTechnical: mockAvg('technicalRating'),
        avgCommunication: mockAvg('communicationRating'),
        avgCoding: mockAvg('codingRating'),
        list: mockRows.map((m) => ({
          _id: m._id, date: m.createdAt,
          subject: m.batch?.subject, batchCode: m.batch?.batchCode, trainerName: m.trainer?.name || '',
          technicalRating: m.technicalRating, communicationRating: m.communicationRating,
          codingRating: m.codingRating, remarks: m.remarks
        }))
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// =========================================================
// BULK ACTIONS (Device Approval & Batch Changes)
// =========================================================

// 1. Bulk Approve Device Changes
app.put('/api/users/bulk-approve-device', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });

  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }

    const users = await User.find({ _id: { $in: userIds } });
    let approvedCount = 0;

    for (const user of users) {
      let deviceApproved = false;

      if (user.desktopChangeRequested) {
        const pendingId = user.pendingDesktopDeviceId || user.pendingDesktopId;
        if (pendingId) {
          user.desktopDeviceId = pendingId;
          user.allowedDesktopId = pendingId;
          user.pendingDesktopDeviceId = null;
          user.pendingDesktopId = null;
          user.desktopChangeRequested = false;
          deviceApproved = true;
        }
      }

      if (user.mobileChangeRequested) {
        const pendingId = user.pendingMobileDeviceId || user.pendingMobileId;
        if (pendingId) {
          user.mobileDeviceId = pendingId;
          user.allowedMobileId = pendingId;
          user.pendingMobileDeviceId = null;
          user.pendingMobileId = null;
          user.mobileChangeRequested = false;
          deviceApproved = true;
        }
      }

      if (deviceApproved) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        approvedCount++;
      }
    }

    res.json({ message: `Successfully approved devices for ${approvedCount} users.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Bulk Move Students to Another Batch
app.put('/api/staff/batches/bulk-change-student', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const { studentIds, oldBatchId, newBatchId } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !oldBatchId || !newBatchId) {
      return res.status(400).json({ message: 'Missing required fields or no students selected' });
    }

    // Remove from old batch
    await BatchMember.deleteMany({ student: { $in: studentIds }, batch: oldBatchId });

    // Add to new batch
    const newMemberships = studentIds.map(studentId => ({
      updateOne: {
        filter: { student: studentId, batch: newBatchId },
        update: { $setOnInsert: { joinedAt: new Date() } },
        upsert: true
      }
    }));

    if (newMemberships.length > 0) {
      await BatchMember.bulkWrite(newMemberships);
    }

    res.json({ message: `Successfully moved ${studentIds.length} students to the new batch` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// =========================================================
// CAMPUS DRIVE / CSR MODULE SCHEMAS (UPGRADED)
// =========================================================

// 1. College Drive Schema (Created by Promotional Team)
const collegeDriveSchema = new mongoose.Schema({
  collegeName: { type: String, required: true },
  driveCode: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  selectedAssignmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  selectedProblemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
scheduledTestTime: { type: Date, default: Date.now }, 
  durationMinutes: { type: Number, default: 60 },
  cutoffPercentage: { type: Number, default: 70 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CollegeDrive = mongoose.model('CollegeDrive', collegeDriveSchema);

const proctorCaptureSchema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String, required: true }
}, { timestamps: true });

// 🚀 SPEED BOOST: Index proctor lookup by drive and student
proctorCaptureSchema.index({ drive: 1, student: 1 });

const ProctorCapture = mongoose.model('ProctorCapture', proctorCaptureSchema);

// 2. Drive Submission / Test Result Schema
const driveSubmissionSchema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: String,
    options: [String],
    correctIndex: Number,
    selectedIndex: Number,
    isCorrect: Boolean,
    marks: Number
  }],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['Selected', 'Rejected'], default: 'Rejected' },
  timeTakenSeconds: { type: Number, default: 0 },
  warningsCount: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 🚀 SPEED BOOST: Index submission lookups used by drive dashboards
driveSubmissionSchema.index({ drive: 1, status: 1 });
driveSubmissionSchema.index({ drive: 1, student: 1 });

const DriveSubmission = mongoose.model('DriveSubmission', driveSubmissionSchema);

// =========================================================
// CAMPUS DRIVE APIS
// =========================================================

// 1. Create a New College Drive (Promotional Team / Admin)
app.post('/api/drives', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const { collegeName, driveCode, selectedAssignmentIds, selectedProblemIds, scheduledTestTime, durationMinutes, cutoffPercentage } = req.body;
    
    // FIX: Parse the ISO string safely, or fallback to current time
    const finalTime = scheduledTestTime ? new Date(scheduledTestTime) : new Date();

    const drive = new CollegeDrive({
      collegeName,
      driveCode,
      createdBy: req.user.id,
      selectedAssignmentIds: selectedAssignmentIds || [],
      selectedProblemIds: selectedProblemIds || [],
      scheduledTestTime: finalTime,
      durationMinutes: Number(durationMinutes) || 60,
      cutoffPercentage: Number(cutoffPercentage) || 70
    });
    await drive.save();
    res.json({ message: 'College Drive created successfully!', drive });
  } catch (e) {
    res.status(500).json({ message: e.code === 11000 ? 'Drive code already exists!' : e.message });
  }
});
// 2. Get All Drives (ULTRA-FAST AGGREGATION - No N+1 loops!)
app.get('/api/drives', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const drives = await CollegeDrive.find()
      .populate('selectedAssignmentIds', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const driveIds = drives.map(d => d._id);

    // Run 2 fast aggregations in parallel instead of 4 queries per drive!
    const [regCounts, subCounts] = await Promise.all([
      User.aggregate([
        { $match: { registeredDrive: { $in: driveIds } } },
        { $group: {
            _id: '$registeredDrive',
            totalRegistered: { $sum: 1 },
            pendingApprovals: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approvedStudents: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }
        }}
      ]),
      DriveSubmission.aggregate([
        { $match: { drive: { $in: driveIds } } },
        { $group: {
            _id: '$drive',
            totalAppeared: { $sum: 1 },
            totalSelected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } },
            totalRejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } }
        }}
      ])
    ]);

    const regMap = Object.fromEntries(regCounts.map(r => [String(r._id), r]));
    const subMap = Object.fromEntries(subCounts.map(s => [String(s._id), s]));

    for (let drive of drives) {
      const r = regMap[String(drive._id)] || {};
      const s = subMap[String(drive._id)] || {};
      drive.totalRegistered = r.totalRegistered || 0;
      drive.pendingApprovals = r.pendingApprovals || 0;
      drive.approvedStudents = r.approvedStudents || 0;
      drive.totalAppeared = s.totalAppeared || 0;
      drive.totalSelected = s.totalSelected || 0;
      drive.totalRejected = s.totalRejected || 0;
    }
    res.json(drives);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3. Public Info of Drive for Student Registration Link
app.get('/api/drives/:code/public-info', async (req, res) => {
  try {
    const drive = await CollegeDrive.findOne({ driveCode: req.params.code, isActive: true })
      .select('collegeName driveCode scheduledTestTime durationMinutes isActive')
      .lean();
    if (!drive) return res.status(404).json({ message: 'Invalid or inactive Campus Drive registration link.' });
    res.json(drive);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4. Student Registration via Special Drive Link (Requires Promo Approval)
app.post('/api/drives/:code/register', async (req, res) => {
  try {
    const drive = await CollegeDrive.findOne({ driveCode: req.params.code, isActive: true });
    if (!drive) return res.status(404).json({ message: 'Campus Drive not found or closed.' });

    const { name, email, password, profilePic, highestQualification, passingYear, percentage, contactNumber, address, stream, branch, yearOfStudy, tenthPercentage, twelfthPercentage, panCard, aadharNumber } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'An account with this email already exists.' });

    // FIX: Set status to 'approved' so they don't have to wait for manual admin approval to take the test
    const user = new User({
      name, email, password, role: 'campus_student', status: 'approved', registeredDrive: drive._id,
      profilePic: profilePic || '', highestQualification: highestQualification || '',
      passingYear: passingYear || '', percentage: percentage || null,
      contactNumber: contactNumber || '', address: address || '', aadharNumber: aadharNumber || '',
      stream: stream || '', branch: branch || '', yearOfStudy: yearOfStudy || '',
      tenthPercentage: tenthPercentage || null, twelfthPercentage: twelfthPercentage || null, panCard: panCard || ''
    });

    await user.save();

    // FIX: Generate JWT token immediately so the student is logged into the test portal
    const token = jwt.sign(
      { id: user._id, role: user.role, version: user.tokenVersion || 0 },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.status(201).json({ 
      message: 'Registration successful! Generating your test portal...',
      token,
      role: user.role,
      userId: user._id
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// 5. Promo Team: Get All Registered Students for a Drive
app.get('/api/drives/:id/students', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const students = await User.find({ registeredDrive: req.params.id })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(students);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 6. Promo Team: Approve / Reject Registered Drive Students (Single or Bulk)
app.put('/api/drives/:id/students/status', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const { studentIds, status } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Provide valid studentIds and status.' });
    }

    const drive = await CollegeDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    await User.updateMany(
      { _id: { $in: studentIds }, registeredDrive: drive._id },
      { $set: { status } }
    );

    if (status === 'approved') {
      const approvedUsers = await User.find({ _id: { $in: studentIds }, registeredDrive: drive._id }).select('name email');
      const loginUrl = `${APP_URL}/login`;
      const scheduledStr = new Date(drive.scheduledTestTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      approvedUsers.forEach((u) => {
        transporter.sendMail({
          from: `"Destination Career" <${EMAIL_USER}>`,
          to: u.email,
          subject: `✅ Approved for ${drive.collegeName} Campus Drive Test`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
              <h2 style="color: #0d9488;">Campus Drive Registration Approved!</h2>
              <p>Hi <strong>${u.name}</strong>,</p>
              <p>Your registration for the <strong>${drive.collegeName}</strong> Campus Recruitment Drive has been approved.</p>
              <p><strong>Scheduled Test Time:</strong> ${scheduledStr}</p>
              <p><strong>Duration:</strong> ${drive.durationMinutes} minutes</p>
              <a href="${loginUrl}" style="display: inline-block; background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Test Portal</a>
            </div>
          `
        }, (err) => { if (err) console.error('Drive approval email error:', err); });
      });
    }

    res.json({ message: `${studentIds.length} student(s) marked as ${status}.` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 7. Restricted Student Portal: Get My Assigned Campus Drive & Test Questions
app.get('/api/campus/my-drive', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role status registeredDrive');
    if (!user || !user.registeredDrive) {
      return res.status(404).json({ message: 'No campus drive linked to your account.' });
    }

    const drive = await CollegeDrive.findById(user.registeredDrive)
      .populate('selectedAssignmentIds')
      .populate('selectedProblemIds')
      .lean();
    if (!drive) return res.status(404).json({ message: 'Campus drive not found.' });

    const existingSub = await DriveSubmission.findOne({ drive: drive._id, student: user._id }).lean();
    if (existingSub) {
      return res.json({
        alreadySubmitted: true,
        collegeName: drive.collegeName,
        submittedAt: existingSub.submittedAt,
        message: 'Thank you for completing the test! We will update your result soon through your email.'
      });
    }

    const now = new Date();
    const scheduled = new Date(drive.scheduledTestTime);
    const isTestLive = drive.isActive && now >= scheduled;

    
    let mcqQuestions = [];
if (isTestLive) {
  (drive.selectedAssignmentIds || []).forEach(assignment => {
    (assignment.topics || []).forEach(topic => {
      (topic.questions || []).forEach(q => {
        if (q.qType === 'MCQ') {
          mcqQuestions.push({
            _id: q._id,
            text: q.text,
            images: q.images,
            options: q.options,
            marks: q.marks
          });
        }
      });
    });
  });
}

// --- CODING QUESTIONS ---
let codingQuestions = [];
    if (isTestLive) {
      (drive.selectedProblemIds || []).forEach(p => {
        if (p && p.statementMd) {
          // FIX: Generate the starter code on the fly for function questions
          const generatedStarterCode = p.mode === 'function' ? harness.starterCode(harness.specOf(p)) : p.starterCode;
          
          codingQuestions.push({
            _id: p._id,
            title: p.title || "Coding Problem",
            statementMd: p.statementMd,
            points: p.points || 10,
            testCases: (p.testCases || []).filter(t => t.isSample),
            starterCode: generatedStarterCode, // <--- Use the generated code
            mode: p.mode,
            functionName: p.functionName,
            returnType: p.returnType,
            params: p.params,
            slug: p.slug, // Include slug so "Run Examples" works
          });
        }
      });
    }

res.json({
  alreadySubmitted: false,
  driveId: drive._id,
  collegeName: drive.collegeName,
  driveCode: drive.driveCode,
  isActive: drive.isActive,
  scheduledTestTime: drive.scheduledTestTime,
  durationMinutes: drive.durationMinutes,
  isTestLive,
  questions: [...mcqQuestions, ...codingQuestions]
});

    
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 8. Submit Campus Drive Test (Blind Submission for Student, Full Metrics for Promo Team)
app.post('/api/drives/:id/submit', verifyToken, async (req, res) => {
  try {
    const { answers = [], timeTakenSeconds = 0, warningsCount = 0, autoSubmitted = false } = req.body;
    // FIX: Add .populate('selectedProblemIds') so we have the test cases to evaluate against
    const drive = await CollegeDrive.findById(req.params.id).populate('selectedAssignmentIds').populate('selectedProblemIds');
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    const existing = await DriveSubmission.findOne({ drive: drive._id, student: req.user.id });
    if (existing) return res.status(400).json({ message: 'You have already submitted this test.' });

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];

    // --- EVALUATE MCQs ---
    (drive.selectedAssignmentIds || []).forEach(assignment => {
      (assignment.topics || []).forEach(topic => {
        (topic.questions || []).forEach(q => {
          if (q.qType === 'MCQ') {
            maxScore += (q.marks || 1);
            const studentAns = answers.find(a => String(a.questionId) === String(q._id));
            const selectedIndex = (studentAns && studentAns.selectedIndex !== undefined) ? studentAns.selectedIndex : null;
            const isCorrect = selectedIndex === q.correctIndex;
            const marks = isCorrect ? (q.marks || 1) : 0;

            if (isCorrect) totalScore += marks;
            gradedAnswers.push({
              questionId: q._id,
              questionText: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              selectedIndex,
              isCorrect,
              marks
            });
          }
        });
      });
    });

    // --- EVALUATE CODING QUESTIONS VIA JUDGE0 ---
    for (const problem of (drive.selectedProblemIds || [])) {
      if (!problem) continue;
      
      const pPoints = problem.points || 10;
      maxScore += pPoints;
      
      // Find the student's submitted code for this problem
      const studentAns = answers.find(a => String(a.questionId) === String(problem._id));
      const code = studentAns ? studentAns.code : '';
      const language = studentAns ? studentAns.language : 'java'; 
      
      let pScore = 0;
      let isCorrect = false;
      
      if (code && code.trim() !== '') {
         // Run the code against ALL test cases (visible + hidden)
         const results = await runCases(problem, code, language, problem.testCases);
         
         const passed = results.filter((r) => r.accepted).length;
         const total = results.length;
         pScore = total > 0 ? Math.round((passed / total) * pPoints) : 0;
         isCorrect = passed === total && total > 0;
      }
      
      totalScore += pScore;
      
      gradedAnswers.push({
         questionId: problem._id,
         questionText: problem.title,
         code: code,
         language: language,
         isCorrect: isCorrect,
         marks: pScore
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = percentage >= drive.cutoffPercentage ? 'Selected' : 'Rejected';

    const submission = new DriveSubmission({
      drive: drive._id,
      student: req.user.id,
      answers: gradedAnswers,
      totalScore,
      maxScore,
      percentage,
      status,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      warningsCount: Number(warningsCount) || 0,
      autoSubmitted: Boolean(autoSubmitted)
    });

    await submission.save();
    res.json({
      message: 'Thank you for completing the test! We will update your result soon through your email.'
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 9. Get Submissions for a Specific Drive (For Promo Dashboard - Cutoff, Time, Malpractice)
app.get('/api/drives/:id/submissions', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const submissions = await DriveSubmission.find({ drive: req.params.id })
      .select('-answers') // 🚀 SPEED BOOST: Don't send huge code/MCQ answer arrays for summary table
      .populate('student', 'name email contactNumber highestQualification passingYear percentage profilePic')
      .sort({ percentage: -1, timeTakenSeconds: 1 })
      .lean();
    res.json(submissions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// --- SAVE WEBCAM SNAPSHOT ---
app.post('/api/drives/:id/proctor', verifyToken, async (req, res) => {
  try {
    await ProctorCapture.create({
      drive: req.params.id,
      student: req.user.id,
      image: req.body.image
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- PROMO TEAM: VIEW STUDENT'S WEBCAM LOGS ---
app.get('/api/drives/:id/proctor/:studentId', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const images = await ProctorCapture.find({ 
      drive: req.params.id, 
      student: req.params.studentId 
    }).sort({ createdAt: 1 }).lean();
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- PROMO TEAM: DELETE STUDENT FROM DRIVE ---
app.delete('/api/drives/:driveId/students/:studentId', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    // Remove the student and any test submissions they made
    await User.findOneAndDelete({ _id: req.params.studentId, registeredDrive: req.params.driveId });
    await DriveSubmission.deleteMany({ student: req.params.studentId, drive: req.params.driveId });
    res.json({ message: 'Student removed from campus drive successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// =========================================================
// ADMIN CREATE USER API (For Promotional / Trainer accounts)
// =========================================================
app.post('/api/users/admin-create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists!' });

    const assignedRole = role || 'promotional';
    const newUser = new User({
      name,
      email,
      password,
      role: assignedRole,
      status: 'approved'
    });

    await newUser.save();

    const loginUrl = `${APP_URL}/login`;
    transporter.sendMail({
      from: `"Destination Career" <${EMAIL_USER}>`,
      to: email,
      subject: `🎉 Welcome to Destination Career — ${assignedRole.toUpperCase()} Account Created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #0d9488;">Welcome, ${name}!</h2>
          <p>Your <strong>${assignedRole}</strong> account has been created by the administrator.</p>
          <p><strong>Login Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Dashboard</a>
        </div>
      `
    }, (err) => { if (err) console.error('Staff welcome email failed:', err); });

    res.json({ message: `${assignedRole} account created successfully!`, user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get ALL MCQ Assignments & Coding Problems for Promo Team
app.get('/api/promo/resources', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'promotional'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [assignments, problems] = await Promise.all([
      Assignment.find({ "topics.questions.qType": "MCQ" }).select('_id title level').lean(),
      Problem.find().select('_id title difficulty points').lean()
    ]);
    res.json({ assignments, problems });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update Questions inside an existing Drive
app.put('/api/drives/:id/questions', verifyToken, async (req, res) => {
  try {
    const { selectedAssignmentIds, selectedProblemIds } = req.body;
    await CollegeDrive.findByIdAndUpdate(req.params.id, {
      selectedAssignmentIds,
      selectedProblemIds
    });
    res.json({ message: 'Questions assigned successfully!' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

const ZERO_ID = '000000000000000000000000';

// ---------- move one or many students into a batch ----------
// oldBatchId can be empty / the zero id (= the student was in no batch).
const moveStudents = async (studentIds, oldBatchId, newBatchId) => {
  if (!mongoose.isValidObjectId(newBatchId)) return { error: 'Choose a batch' };
  const newBatch = await Batch.findById(newBatchId);
  if (!newBatch) return { error: 'Batch not found' };
  if (newBatch.isActive === false) return { error: 'This batch is not active' };

  const ids = [...new Set((Array.isArray(studentIds) ? studentIds : []).map(String))]
    .filter((x) => mongoose.isValidObjectId(x))
    .slice(0, 500);
  if (!ids.length) return { error: 'No students selected' };

  const students = await User.find({ _id: { $in: ids }, role: 'student' }).distinct('_id');
  if (!students.length) return { error: 'No valid students found' };

  // leave the old batch (their attendance history stays as it was)
  if (oldBatchId && String(oldBatchId) !== ZERO_ID && mongoose.isValidObjectId(oldBatchId) && String(oldBatchId) !== String(newBatchId)) {
    await BatchMember.deleteMany({ batch: oldBatchId, student: { $in: students } });
  }

  // join the new batch (safe to repeat)
  await BatchMember.bulkWrite(students.map((s) => ({
    updateOne: {
      filter: { batch: newBatch._id, student: s },
      update: { $setOnInsert: { joinedAt: new Date() } },
      upsert: true
    }
  })));

  return { moved: students.length };
};

app.put('/api/staff/batches/change-student', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { studentId, oldBatchId, newBatchId } = req.body;
    const r = await moveStudents([studentId], oldBatchId, newBatchId);
    if (r.error) return res.status(400).json({ message: r.error });
    res.json({ message: 'Student moved', moved: r.moved });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/staff/batches/bulk-change-student', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { studentIds, oldBatchId, newBatchId } = req.body;
    const r = await moveStudents(studentIds, oldBatchId, newBatchId);
    if (r.error) return res.status(400).json({ message: r.error });
    res.json({ message: `${r.moved} student(s) moved`, moved: r.moved });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---------- delete a user (REPLACES the old DELETE /api/users/:id) ----------
const removeStudentData = async (u) => {
  const apps = await Application.find({ student: u._id }).select('photoFileId resumeFileId');
  for (const a of apps) {
    await deleteGridFile(a.photoFileId);
    await deleteGridFile(a.resumeFileId);
  }
  const optional = mongoose.models.DriveSubmission
    ? [mongoose.models.DriveSubmission.deleteMany({ student: u._id })]
    : [];
  await Promise.all([
    Application.deleteMany({ student: u._id }),
    BatchMember.deleteMany({ student: u._id }),
    Attendance.deleteMany({ student: u._id }),
    AssignmentAnswer.deleteMany({ user: u._id }),
    MockRating.deleteMany({ student: u._id }),
    Submission.deleteMany({ user: u._id }),
    Doubt.deleteMany({ user: u._id }),
    Doubt.updateMany({ 'replies.user': u._id }, { $pull: { replies: { user: u._id } } }),
    OTP.deleteMany({ email: u.email }),
    ...optional
  ]);
};

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete a super admin account' });

    const isStudentType = target.role === 'student' || target.role === 'campus_student';
    if (!isStudentType && !isSuperAdmin(req)) {
      return res.status(403).json({ message: 'Only the super admin can remove admins, trainers or staff' });
    }
    if (target.role === 'trainer' && (await Batch.exists({ trainer: target._id }))) {
      return res.status(400).json({ message: 'This trainer still has batches. Delete or reassign those batches first.' });
    }

    if (isStudentType) await removeStudentData(target);
    await target.deleteOne();
    res.json({ message: `${target.name} removed` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ============================================================================
// ONLINE LIVE CLASSES & WEBINAR MODULE (1000-3000 STUDENTS SCALE WITH LIVEKIT)
// ============================================================================

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const onlineClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  batchCode: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  scheduledTime: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },

  // Real-time Classroom Controls
  chatEnabled: { type: Boolean, default: true },
  pinnedAnnouncement: { type: String, default: '' },
  allowedSpeakers: [{ type: String }], // Student User IDs allowed to unmute Mic/Cam
  raisedHands: [{
    userId: String,
    name: String,
    email: String,
    raisedAt: { type: Date, default: Date.now }
  }],

  // Live Chat Messages (capped to last 200 for performance)
  messages: [{
    senderId: String,
    senderName: String,
    senderRole: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Live Polls
  polls: [{
    question: String,
    options: [String],
    votes: [{ userId: String, optionIndex: Number }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Auto-Attendance Tracking
  attendance: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    firstJoinedAt: Date,
    lastSeenAt: Date
  }]
}, { timestamps: true });

const OnlineClass = mongoose.models.OnlineClass || mongoose.model('OnlineClass', onlineClassSchema);

// Helper to get LiveKit RoomServiceClient
const getLiveKitClient = () => {
  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) return null;
  const httpUrl = process.env.LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
  return new RoomServiceClient(httpUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
};

// Class end time = scheduledTime + duration
const getClassEnd = (cls) =>
  new Date(new Date(cls.scheduledTime).getTime() + (cls.durationMinutes || 60) * 60000);

// Fields that are wiped when a class is closed (chat, polls, hands, speaker permissions, pin).
// Attendance is kept as a record.
const endedFields = () => ({
  status: 'ended',
  messages: [],
  polls: [],
  raisedHands: [],
  allowedSpeakers: [],
  pinnedAnnouncement: ''
});

// Auto-close every class whose time is over and delete its in-class history
const sweepExpiredClasses = async () => {
  try {
    const expired = await OnlineClass.find({
      status: { $ne: 'ended' },
      $expr: {
        $lt: [
          { $add: ['$scheduledTime', { $multiply: [{ $ifNull: ['$durationMinutes', 60] }, 60000] }] },
          new Date()
        ]
      }
    }).select('_id').lean();

    if (expired.length) {
      await OnlineClass.updateMany(
        { _id: { $in: expired.map(e => e._id) } },
        { $set: endedFields() }
      );
    }
  } catch (e) {
    console.error('Sweep error:', e.message);
  }
};

// 1. Get all Trainers (for Super Admin dropdown) + All Online Classes
app.get('/api/online-classes', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'trainer') {
      query = { trainer: req.user.id };
    }
    const classes = await OnlineClass.find(query)
      .populate('trainer', 'name email profilePic')
      .select('-messages') // keep list lightweight
      .sort({ scheduledTime: -1 })
      .lean();

    // Auto-close sessions whose time is over
    const now = new Date();
    const expiredIds = [];
    classes.forEach(c => {
      if (c.status !== 'ended' && getClassEnd(c) < now) {
        c.status = 'ended';
        expiredIds.push(c._id);
      }
    });
    if (expiredIds.length) {
      await OnlineClass.updateMany({ _id: { $in: expiredIds } }, { $set: endedFields() });
    }

    const trainers = await User.find({ role: 'trainer' }).select('name email').lean();
    res.json({ classes, trainers });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2. Super Admin / Trainer: Create Online Batch / Class
app.post('/api/online-classes', verifyToken, async (req, res) => {
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin' &&
    req.user.role !== 'trainer'
  ) {
    return res.status(403).json({
      message: 'Only Admin and Trainers can create online classes'
    });
  }

  try {
    const {
      title,
      batchCode,
      subject,
      trainerId,
      scheduledTime,
      durationMinutes
    } = req.body;

    if (!title || !batchCode || !subject || !scheduledTime) {
      return res.status(400).json({
        message: 'Title, Batch Code, Subject and Scheduled Time are required.'
      });
    }

    const cleanCode = batchCode.trim().toUpperCase().replace(/\s+/g, '-');

    const existing = await OnlineClass.findOne({ batchCode: cleanCode });

    if (existing) {
      return res.status(400).json({
        message: 'Batch Code already exists. Choose a unique code.'
      });
    }

    // If a trainer creates the class and no trainerId is provided,
    // assign themselves as the trainer.
    const finalTrainerId =
      req.user.role === 'trainer'
        ? (trainerId || req.user._id || req.user.id)
        : (trainerId || null);

    const newClass = await OnlineClass.create({
      title,
      batchCode: cleanCode,
      subject,
      trainer: finalTrainerId,
      scheduledTime,
      durationMinutes: Number(durationMinutes) || 60
    });

    const populated = await OnlineClass
      .findById(newClass._id)
      .populate('trainer', 'name email');

    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({
      message: e.message || 'Failed to create online class'
    });
  }
});

// 3. Super Admin / Trainer: Update Trainer, Class Timings, or Status anytime
//    Changing time re-evaluates status. Batch code (link) never changes.
app.put('/api/online-classes/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'trainer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const existing = await OnlineClass.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Class not found' });

    const { title, subject, trainerId, scheduledTime, durationMinutes, status } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (trainerId !== undefined) updateData.trainer = trainerId || null;
    if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime;
    if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
    if (status !== undefined) updateData.status = status;

    // If time/duration changed and no explicit status was sent, re-evaluate status
    if (status === undefined && (scheduledTime !== undefined || durationMinutes !== undefined)) {
      const newStart = new Date(scheduledTime !== undefined ? scheduledTime : existing.scheduledTime);
      const newDur = durationMinutes !== undefined ? Number(durationMinutes) : (existing.durationMinutes || 60);
      const newEnd = new Date(newStart.getTime() + newDur * 60000);
      const now = new Date();

      if (newEnd <= now) {
        updateData.status = 'ended';
      } else if (existing.status === 'ended' || newStart > now) {
        updateData.status = 'scheduled'; // reopened / rescheduled
      }
    }

    // Class is being closed -> wipe in-class history and disconnect the room
    const closingNow = updateData.status === 'ended' && existing.status !== 'ended';
    if (updateData.status === 'ended') Object.assign(updateData, endedFields());

    const updated = await OnlineClass.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('trainer', 'name email');

    if (closingNow) {
      const lk = getLiveKitClient();
      if (lk) lk.deleteRoom(existing.batchCode).catch(() => {});
    }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4. Delete Online Class
app.delete('/api/online-classes/:id', verifyToken, async (req, res) => {
  if (!['admin', 'superadmin', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    await OnlineClass.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// 5. Join Class & Generate LiveKit Token (Logs Student Attendance Automatically)
app.post('/api/online-classes/:batchCode/join', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({ batchCode: req.params.batchCode.toUpperCase() })
      .populate('trainer', 'name email');
    if (!cls) return res.status(404).json({ message: 'Online Class not found' });

    const user = await User.findById(req.user.id).select('-profilePic').lean();
    if (!user) return res.status(401).json({ message: 'User not found' });

    const isHost = ['admin', 'superadmin'].includes(user.role) ||
                   (cls.trainer && String(cls.trainer._id) === String(user._id));

    const now = new Date();
    const start = new Date(cls.scheduledTime);
    const end = getClassEnd(cls);
    const isOver = cls.status === 'ended' || now > end;

    const gateInfo = {
      title: cls.title,
      subject: cls.subject,
      scheduledTime: start.toISOString(),
      endTime: end.toISOString(),
      serverTime: now.toISOString()
    };

    // STRICT TIME GATE: students cannot enter before the scheduled start time
    if (!isHost) {
      if (isOver) {
        if (cls.status !== 'ended') {
          await OnlineClass.updateOne({ _id: cls._id }, { $set: endedFields() });
        }
        return res.status(410).json({ code: 'ENDED', message: 'This session is closed.', ...gateInfo });
      }
      if (now < start) {
        return res.status(403).json({ code: 'NOT_STARTED', message: 'Class will start soon.', ...gateInfo });
      }
    }

    const uid = String(user._id);

    if (!isHost) {
      // Atomic updates (no cls.save) -> safe with hundreds of students joining at once
      await OnlineClass.updateOne({ _id: cls._id }, { $pull: { raisedHands: { userId: uid } } });

      const seen = await OnlineClass.updateOne(
        { _id: cls._id, 'attendance.student': user._id },
        { $set: { 'attendance.$.lastSeenAt': new Date() } }
      );
      if (!seen.matchedCount) {
        await OnlineClass.updateOne(
          { _id: cls._id, 'attendance.student': { $ne: user._id } },
          { $push: { attendance: {
              student: user._id,
              name: user.name,
              email: user.email,
              firstJoinedAt: new Date(),
              lastSeenAt: new Date()
          } } }
        );
      }
    } else if (cls.status === 'scheduled' && !isOver && now >= start) {
      // Only auto-mark live once the scheduled start time has arrived
      await OnlineClass.updateOne({ _id: cls._id }, { $set: { status: 'live' } });
      cls.status = 'live';
    }

    const canSpeak = (cls.allowedSpeakers || []).includes(uid);
    const canPublish = isHost || canSpeak;

    // Generate LiveKit Token (canPublish=true allows Mic + Camera + Screen Share)
    let lkToken = null;

    if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
      const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
          identity: uid,
          name: `${user.name} (${isHost ? 'Trainer' : 'Student'})`,
          metadata: JSON.stringify({
            role: isHost ? 'host' : 'student',
            email: user.email
          })
        }
      );

      at.addGrant({
        roomJoin: true,
        room: cls.batchCode,
        canPublish,
        canSubscribe: true,
        canPublishData: true
      });

      lkToken = await at.toJwt();
    }

    res.json({
      classData: cls,
      isHost,
      canSpeak,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      livekitToken: lkToken,
      livekitUrl: process.env.LIVEKIT_URL || ''
    });
  } catch (e) {
    console.error('JOIN ERROR:', e);
    res.status(500).json({ message: e.message });
  }
});


// 6. Real-Time Classroom State Polling (Chat, Polls, Raised Hands, Permissions)
app.get('/api/online-classes/:batchCode/state', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    })
      .populate('trainer', 'name email')
      .lean();

    if (!cls) return res.status(404).json({ message: 'Not found' });

    // Time is over -> close and wipe history
    if (cls.status !== 'ended' && getClassEnd(cls) < new Date()) {
      await OnlineClass.updateOne({ _id: cls._id }, { $set: endedFields() });
      Object.assign(cls, endedFields());
    }

    res.json(cls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// Safely update a participant's publish permission in LiveKit (never throws)
const setSpeakerPermission = async (room, identity, allow) => {
  const lk = getLiveKitClient();
  if (!lk) return;
  try {
    await lk.updateParticipant(room, String(identity), undefined, {
      canPublish: allow,
      canSubscribe: true,
      canPublishData: true
    });
  } catch (err) {
    console.error('LiveKit permission update error:', err.message);
  }
};

// 7. Trainer Controls: Toggle Chat, Pin Announcement, Allow/Revoke Student Mic, Cam & Screen Share
app.post('/api/online-classes/:batchCode/controls', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    });

    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const isHost =
      ['admin', 'superadmin'].includes(req.user.role) ||
      String(cls.trainer) === String(req.user.id);

    if (!isHost) {
      return res.status(403).json({
        message: 'Only Trainer/Admin can change classroom controls'
      });
    }

    const {
      action,
      studentId,
      chatEnabled,
      pinnedAnnouncement,
      status
    } = req.body;

    if (action === 'toggle-chat') {
      cls.chatEnabled = chatEnabled;
    } else if (action === 'pin') {
      cls.pinnedAnnouncement = pinnedAnnouncement || '';
    } else if (action === 'status') {
      if (status === 'ended') {
        cls.status = 'ended';
        cls.messages = [];
        cls.polls = [];
        cls.raisedHands = [];
        cls.allowedSpeakers = [];
        cls.pinnedAnnouncement = '';

        const lk = getLiveKitClient();
        if (lk) lk.deleteRoom(cls.batchCode).catch(() => {});
      } else {
        cls.status = status;
      }
    } else if (action === 'allow-speaker' && studentId) {
      if (!cls.allowedSpeakers.includes(studentId)) {
        cls.allowedSpeakers.push(studentId);
      }

      cls.raisedHands = cls.raisedHands.filter(h => h.userId !== studentId);

      setSpeakerPermission(cls.batchCode, studentId, true);
    } else if (action === 'revoke-speaker' && studentId) {
      cls.allowedSpeakers = cls.allowedSpeakers.filter(id => id !== studentId);

      setSpeakerPermission(cls.batchCode, studentId, false);
    } else if (action === 'revoke-all-speakers') {
      const prevSpeakers = [...cls.allowedSpeakers];
      cls.allowedSpeakers = [];

      prevSpeakers.forEach(sId => setSpeakerPermission(cls.batchCode, sId, false));
    }

    await cls.save();
    res.json(cls);
  } catch (e) {
    console.error('CONTROLS ERROR:', e);
    res.status(500).json({ message: e.message });
  }
});

// 8. Student Raise / Lower Hand
app.post('/api/online-classes/:batchCode/hand', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    });

    const user = await User.findById(req.user.id).lean();
    const uId = String(user._id);

    const exists = cls.raisedHands.some(h => h.userId === uId);

    if (exists) {
      cls.raisedHands = cls.raisedHands.filter(h => h.userId !== uId);
    } else {
      cls.raisedHands.push({
        userId: uId,
        name: user.name,
        email: user.email
      });
    }

    await cls.save();
    res.json({ raisedHands: cls.raisedHands });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 9. Send Chat Message
app.post('/api/online-classes/:batchCode/chat', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    });

    const user = await User.findById(req.user.id).lean();

    const isHost =
      ['admin', 'superadmin'].includes(user.role) ||
      String(cls.trainer) === String(user._id);

    if (!cls.chatEnabled && !isHost) {
      return res.status(403).json({
        message: 'Chat is currently disabled by the Trainer.'
      });
    }

    cls.messages.push({
      senderId: String(user._id),
      senderName: user.name,
      senderRole: isHost ? 'Trainer' : 'Student',
      text: req.body.text
    });

    if (cls.messages.length > 200) {
      cls.messages = cls.messages.slice(-200);
    }

    await cls.save();
    res.json(cls.messages);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 10. Create Poll & Vote on Poll
app.post('/api/online-classes/:batchCode/polls', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    });

    const { question, options } = req.body;

    cls.polls.forEach(p => {
      p.isActive = false;
    });

    cls.polls.push({
      question,
      options,
      votes: [],
      isActive: true
    });


    await cls.save();
    res.json(cls.polls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/online-classes/:batchCode/polls/:pollId/vote', verifyToken, async (req, res) => {
  try {
    const cls = await OnlineClass.findOne({
      batchCode: req.params.batchCode.toUpperCase()
    });

    const poll = cls.polls.id(req.params.pollId);

    if (!poll || !poll.isActive) {
      return res.status(400).json({ message: 'Poll is closed' });
    }

    const uId = String(req.user.id);
    const existingVote = poll.votes.find(v => v.userId === uId);

    if (existingVote) {
      existingVote.optionIndex = req.body.optionIndex;
    } else {
      poll.votes.push({
        userId: uId,
        optionIndex: req.body.optionIndex
      });
    }
    await cls.save();
    res.json(cls.polls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Close expired classes (and delete their chat/polls) every minute
sweepExpiredClasses();
setInterval(sweepExpiredClasses, 60 * 1000);

app.listen(port, () => {
  console.log(`🚀 SERVER VERSION 2.0 RUNNING ON PORT ${port}`);
});