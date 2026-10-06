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

// FIX: the JWT secret now comes from .env (falls back to the old value so logged-in users are not kicked out)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(cors({ origin: ['https://destinationcareer.pages.dev', 'https://www.yourcustomdomain.com'] }));
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
  metric: { type: String, default: 'Top Scorer' }
});
const TopPerformer = mongoose.model('TopPerformer', topPerformerSchema);


const nodemailer = require('nodemailer');

// Configure your email transporter
// FIX: email address and app password now come from .env (EMAIL_USER and EMAIL_PASS)
const EMAIL_USER = process.env.EMAIL_USER;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});




// 0. DATABASE SCHEMAS
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'superadmin', 'trainer'], default: 'student' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
  employabilityScore: { type: Number, default: 0 },

  // --- STUDENT ELIGIBILITY PROFILE ---
  highestQualification: { type: String, default: '' },
  passingYear: { type: String, default: '' },
  percentage: { type: Number, default: null },
  backlogs: { type: Number, default: 0 },
  educationGap: { type: Number, default: 0 },
  readyForRelocation: { type: Boolean, default: false },
  skillsAcquired: { type: String, default: '' }, // Stored as comma-separated string
  
  // --- Flag to lock profile after first edit ---
  profileLocked: { type: Boolean, default: false },

  // --- NEW: SINGLE DEVICE BINDING ---
  allowedDeviceId: { type: String, default: null }, // The authorized device
  pendingDeviceId: { type: String, default: null }, // The new device waiting for approval
  deviceChangeRequested: { type: Boolean, default: false }, // Flag to alert admin
  tokenVersion: { type: Number, default: 0 } // Used to instantly log out old devices
});

// Hash password before saving (requires bcryptjs)
userSchema.pre('save', async function () {
  // If password is not modified, exit the function (Mongoose continues automatically)
  if (!this.isModified('password')) return;
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // No need to call next() or try/catch. Mongoose handles async errors automatically.
});

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

// Auto-create Super Admin
// Auto-create or Update Super Admin
const createSuperAdmin = async () => {
  try {
    let superAdmin = await User.findOne({ email: 'super@test.com' });
    
    if (!superAdmin) {
      // Create new superadmin if none exists
      superAdmin = new User({ 
        name: 'Master Super Admin', 
        email: 'super@test.com', 
        password: 'superpassword', 
        role: 'superadmin', 
        status: 'approved'
      });
      await superAdmin.save(); // The pre('save') hook hashes it
      console.log("✅ Superadmin created with hashed password");
    } else {
      // FIX: If the password doesn't start with bcrypt's signature ('$2a$' or '$2b$'), it is plain text.
      if (!superAdmin.password.startsWith('$2a$') && !superAdmin.password.startsWith('$2b$')) {
        superAdmin.password = 'superpassword'; // Reset to plain text
        await superAdmin.save(); // This triggers the pre('save') hook to hash it!
        console.log("✅ Superadmin plain-text password converted to secure hash");
      }
    }
  } catch (err) {
    console.error("Superadmin creation error:", err);
  }
};
createSuperAdmin();

// 3. AUTH MIDDLEWARE
// 3. AUTH MIDDLEWARE
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // NEW: Check if the token version matches the DB. If it doesn't, the old device was revoked.
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



// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // 2. Assign role (force normal users to 'student')
    const assignedRole = role === 'admin' ? 'admin' : 'student';
    
    // 3. Create the new user. 
    // (The userSchema.pre('save') hook we added earlier will automatically hash the password here)
    const newUser = new User({ 
      name, 
      email, 
      password, 
      role: assignedRole, 
      status: 'pending' // They must wait for admin approval
    });
    
    // 4. Save to database
    await newUser.save();
    
    res.status(201).json({ message: 'Registration submitted. Awaiting approval.' });
  } catch (err) {
    // This console.log will print the exact reason for a 500 error in your Node terminal
    console.error("Registration Error:", err); 
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body; // NEW: extract deviceId
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'pending') return res.status(403).json({ message: 'Pending verification.' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Registration declined.' });

    // --- NEW: DEVICE BINDING LOGIC (For Students Only) ---
    if (user.role === 'student') {
      if (!deviceId) return res.status(400).json({ message: 'Device identification missing.' });

      if (!user.allowedDeviceId) {
        // First ever login: bind this device automatically
        user.allowedDeviceId = deviceId;
        await user.save();
      } else if (user.allowedDeviceId !== deviceId) {
        // Different device detected! Block login and alert admin.
        user.pendingDeviceId = deviceId;
        user.deviceChangeRequested = true;
        await user.save();
        return res.status(403).json({ message: 'New device detected. Approval requested from your admin. Please try again later.' });
      }
    }

    // Include the tokenVersion in the JWT payload
    const token = jwt.sign({ id: user._id, role: user.role, version: user.tokenVersion }, JWT_SECRET, { expiresIn: '4h' });
    res.json({ message: 'Login successful', role: user.role, token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// --- NEW: ADMIN APPROVE DEVICE CHANGE ---
app.put('/api/users/:id/approve-device', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Swap the pending device to allowed
    user.allowedDeviceId = user.pendingDeviceId;
    user.pendingDeviceId = null;
    user.deviceChangeRequested = false;
    
    // CRITICAL: Increment token version to instantly log out the old device
    user.tokenVersion += 1; 
    
    await user.save();
    res.json({ message: 'New device approved. Old device has been logged out.' });
  } catch (error) {
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

// NEW: UPDATE ROUTE (Needed for Editing)
app.put('/api/courses/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    // FIX: { new: true } is deprecated in Mongoose, { returnDocument: 'after' } does the same thing
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ message: 'Course updated', course: updatedCourse });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/courses/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


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
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// 4. Delete a job (Admin) - THIS FIXES YOUR 404 ERROR
app.delete('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// --- Top Performers API ---
app.get('/api/performers', async (req, res) => {
  const data = await TopPerformer.find();
  res.json(data);
});
app.put('/api/performers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).send('Denied');
  const updatedPerformer = await TopPerformer.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  res.json(updatedPerformer);
});
app.post('/api/performers', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).send('Denied');
  const newPerformer = new TopPerformer(req.body);
  await newPerformer.save();
  res.json(newPerformer);
});
app.delete('/api/performers/:id', verifyToken, async (req, res) => {
  await TopPerformer.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// --- NEW: USER APPROVALS API ---
app.get('/api/users/pending', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Changes Required..........
app.put('/api/users/:id/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });
  
  try {
    const { status } = req.body; 
    // { returnDocument: 'after' } ensures we get the user's data (like email) back after updating
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    
    // --- TRIGGER EMAIL IF APPROVED ---
    if (status === 'approved') {
      const mailOptions = {
        from: `"Destination Career" <${EMAIL_USER}>`,
        to: user.email,
        subject: '🎉 Congratulations! Your Account is Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #2563eb;">Welcome to Destination Career!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Congratulations! Your registration has been reviewed and approved by our administrative team.</p>
            <p>You can now log in to your dashboard to access your courses, mock tests, and placement resources.</p>
            <a href="http://localhost:3000/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Dashboard</a>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not request this account, please ignore this email.</p>
          </div>
        `
      };

      // Send the email asynchronously so it doesn't slow down the admin UI
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
    // req.user.id comes from your verifyToken middleware
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


// --- STUDENT PROFILE ROUTES ---

// Update Profile (Student - One Time Only)
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Reject request if the profile is already locked
    if (user.profileLocked) {
      return res.status(403).json({ 
        message: 'Your profile is locked. Please contact an admin to make changes.' 
      });
    }

    const { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired } = req.body;
    
    // Update fields
    user.highestQualification = highestQualification;
    user.passingYear = passingYear;
    user.percentage = percentage;
    user.backlogs = backlogs;
    user.educationGap = educationGap;
    user.readyForRelocation = readyForRelocation;
    user.skillsAcquired = skillsAcquired;
    
    // Lock the profile
    user.profileLocked = true; 
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// // Admin Override Route (Required so admins can fix locked profiles)
// app.put('/api/users/:id/admin-edit-profile', verifyToken, async (req, res) => {
//   if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
//     return res.status(403).json({ message: 'Access denied' });
//   }
  
//   try {
//     const { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired, profileLocked } = req.body;
    
//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id, 
//       { highestQualification, passingYear, percentage, backlogs, educationGap, readyForRelocation, skillsAcquired, profileLocked }, 
//       { returnDocument: 'after' }
//     ).select('-password');
    
//     res.json(updatedUser);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


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

// 1. Get all doubts for a specific video
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

// 2. Ask a new doubt
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

// 3. Reply to an existing doubt
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

// 4. Trainer/Admin marks a reply as correct
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


// Admin Override Route (Required so admins can fix locked profiles)
app.put('/api/users/:id/admin-edit-profile', verifyToken, async (req, res) => {
  // Ensure only admins/superadmins can access this
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

// 2. Fetch a single job by ID (We will need this for the next step)
app.get('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Admin: Toggle Job Status (OPEN/CLOSED)
app.put('/api/jobs/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json(job);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Student: Apply for Job
app.post('/api/jobs/:id/apply', verifyToken, async (req, res) => {
  try {
    // Logic to store the application can be expanded here later
    res.json({ message: "Application submitted successfully!" });
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

const isAdminUser = (req) => req.user.role === 'admin' || req.user.role === 'superadmin';

// Students + admins: list and view
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

// Admin: create / update / delete company
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
  if (!isAdminUser(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: manage questions inside a company
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
  }]
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
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
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
};

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

// Public on purpose: <img> tags cannot send the login token. IDs are unguessable.
app.get('/api/assignment-images/:id', async (req, res) => {
  try {
    const img = await AssignmentImage.findById(req.params.id);
    if (!img) return res.status(404).end();
    res.set('Content-Type', img.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(img.data);
  } catch { res.status(404).end(); }
});

// ---- Admin: create / update / delete ----
app.post('/api/assignments', verifyToken, async (req, res) => {
  if (!adminOnly(req, res)) return;
  try {
    const { title, level, description, topics } = req.body;
    const a = await Assignment.create({ title, level, description, topics });
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/assignments/:id', verifyToken, async (req, res) => {
  if (!adminOnly(req, res)) return;
  try {
    const { title, level, description, topics } = req.body;
    const a = await Assignment.findByIdAndUpdate(
      req.params.id, { title, level, description, topics }, { returnDocument: 'after', runValidators: true }
    );
    res.json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.delete('/api/assignments/:id', verifyToken, async (req, res) => {
  if (!adminOnly(req, res)) return;
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    const imageIds = a.topics.flatMap((t) => t.questions.flatMap((q) => q.images));
    await AssignmentImage.deleteMany({ _id: { $in: imageIds } });
    await AssignmentAnswer.deleteMany({ assignment: a._id });
    await a.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---- Admin: review + grade ----
app.get('/api/assignments/:id/review', verifyToken, async (req, res) => {
  if (!adminOnly(req, res)) return;
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ message: 'Not found' });
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
  if (!adminOnly(req, res)) return;
  try {
    const ans = await AssignmentAnswer.findById(req.params.id);
    if (!ans) return res.status(404).json({ message: 'Not found' });
    const a = await Assignment.findById(ans.assignment);
    const q = a ? findQuestion(a, ans.questionId) : null;
    const max = q ? q.marks : Infinity;
    ans.marks = Math.max(0, Math.min(Number(req.body.marks) || 0, max));
    ans.feedback = req.body.feedback || '';
    ans.graded = true;
    await ans.save();
    res.json({ message: 'Graded' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---- Students (and admin): list, open, answer ----
app.get('/api/assignments', verifyToken, async (req, res) => {
  try {
    const list = await Assignment.find().sort({ createdAt: -1 }).lean();
    const mine = await AssignmentAnswer.find({ user: req.user.id }).select('assignment marks graded').lean();
    const stats = {};
    mine.forEach((x) => {
      const k = String(x.assignment);
      stats[k] = stats[k] || { answered: 0, marks: 0, pending: 0 };
      stats[k].answered++;
      stats[k].marks += x.marks || 0;
      if (!x.graded) stats[k].pending++;
    });
    res.json(list.map((a) => {
      const qs = a.topics.flatMap((t) => t.questions);
      const s = stats[String(a._id)] || { answered: 0, marks: 0, pending: 0 };
      return {
        _id: a._id, title: a.title, level: a.level, description: a.description,
        modules: a.topics.length,
        questions: qs.length,
        totalMarks: qs.reduce((sum, q) => sum + (q.marks || 0), 0),
        answered: s.answered, marks: s.marks, pending: s.pending
      };
    }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments/:id', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ message: 'Not found' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isAdmin) {
      a.topics.forEach((t) => t.questions.forEach((q) => { delete q.correctIndex; delete q.explanation; }));
    }
    res.json(a);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/assignments/:id/my-answers', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    const answers = await AssignmentAnswer.find({ user: req.user.id, assignment: a._id });
    res.json(answers.map((ans) => answerView(ans, findQuestion(a, ans.questionId))));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/assignments/:id/questions/:qid/answer', verifyToken, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
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
  qrToken: { type: String, required: true },          // static, printed QR secret
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
const Batch = mongoose.model('Batch', batchSchema);

const classSessionSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true },          // 'YYYY-MM-DD'
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date, default: null },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  currentToken: { type: String, default: '' },        // rotates while open
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
const isSuperAdmin = (req) => req.user.role === 'superadmin';
const isAdminOrSuper = (req) => req.user.role === 'admin' || req.user.role === 'superadmin';
const isTrainer = (req) => req.user.role === 'trainer';


// ================= PASSWORD RESET OTP =================
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
});

const OTP = mongoose.model('OTP', otpSchema);

// --- Forgot Password: Request OTP ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp
    });

    const mailOptions = {
      from: `"Destination Career" <${EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Destination Career Password Reset OTP',
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        ">
          <h2 style="color: #2563eb;">
            Password Reset Request
          </h2>

          <p>
            Hi <strong>${user.name}</strong>,
          </p>

          <p>
            Use the following OTP to reset your
            Destination Career password:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p style="
            font-size: 12px;
            color: #6b7280;
          ">
            If you did not request a password reset,
            please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'OTP sent successfully to your email.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});


// --- Verify Password Reset OTP ---
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.'
      });
    }

    const record = await OTP.findOne({
      email,
      otp
    });

    if (!record) {
      return res.status(400).json({
        message: 'Invalid or expired OTP.'
      });
    }

    res.json({
      message: 'OTP verified successfully.'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});


// --- Reset Password ---
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const {
      email,
      newPassword,
      otp
    } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    const record = await OTP.findOne({
      email,
      otp
    });

    if (!record) {
      return res.status(400).json({
        message: 'Invalid or expired OTP.'
      });
    }

    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    // Keep password handling consistent
    // with the existing User schema.
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: newPassword
        }
      }
    );

    // OTP can be used only once.
    await OTP.deleteMany({
      email
    });

    res.json({
      message: 'Password reset successful. You can now log in.'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

// ---------- SUPERADMIN: trainer accounts ----------
app.post('/api/trainers', verifyToken, async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Only super admin can add trainers' });
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' });
    const trainer = await User.create({ name, email, password, role: 'trainer', status: 'approved' });

    transporter.sendMail({
      from: `"Destination Career" <${EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Destination Career — Trainer Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Your trainer account has been created on Destination Career.</p>
          <p><strong>Login Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
          <a href="http://localhost:3000/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Login to Dashboard</a>
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
            <li><strong>Schedule:</strong> ${scheduledStartTime || '-'} to ${scheduledEndTime || '-'}</li>
            <li><strong>Duration:</strong> ${durationMinutes || 60} minutes</li>
          </ul>
          <a href="http://localhost:3000/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">View in Dashboard</a>
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

// ---------- TRAINER: check-in / check-out ----------
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

// Rotating token for the student-facing QR — trainer polls this every few seconds
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

// ---------- STUDENT: mark attendance ----------
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

// ---------- ADMIN/SUPERADMIN: reports ----------
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

// Roster: students who have attended at least one session of this batch.
// (There's no formal batch enrollment yet, so this is derived from attendance.)
app.get('/api/batches/:id/students', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });

  const sessionIds = (await ClassSession.find({ batch: batch._id }).select('_id')).map((s) => s._id);
  const studentIds = await Attendance.find({ session: { $in: sessionIds } }).distinct('student');
  res.json(await User.find({ _id: { $in: studentIds } }).select('name email'));
});

// Trainer's past classes for a batch, with present/absent counts
app.get('/api/batches/:id/sessions', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  const sessions = await ClassSession.find({ batch: batch._id }).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(sessions.map(async (s) => ({ ...s, attendedCount: await Attendance.countDocuments({ session: s._id }) })));
  res.json(withCounts);
});

// Trainer gives a mock rating
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

// Ratings given for a batch (trainer/admin)
app.get('/api/mock-ratings/batch/:id', verifyToken, async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ message: 'Not found' });
  if (isTrainer(req) && String(batch.trainer) !== req.user.id) return res.status(403).json({ message: 'Not your batch' });
  if (!isTrainer(req) && !isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  res.json(await MockRating.find({ batch: batch._id }).populate('student', 'name email').sort({ createdAt: -1 }));
});

// Student's own ratings, grouped batch-wise with averages
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
  if (!isSuperAdmin(req)) return res.status(403).json({ message: 'Access denied' });
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  res.json(await User.find(filter).select('-password').sort({ createdAt: -1 }));
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


// ================= CODING TESTS / COMPILER =================
// NEW: builds the hidden "driver" code for function-style questions (student writes only the method)
const harness = require('./judgeHarness');
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const judge0Headers = process.env.JUDGE0_TOKEN ? { 'X-Auth-Token': process.env.JUDGE0_TOKEN } : {};
// Students can only use these three languages (anything else is rejected as "Unsupported language")
const LANG_IDS = { java: 62, python: 71, javascript: 63 };
const b64 = (s) => Buffer.from(s || '', 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Prints which Judge0 server the code will talk to (helps when debugging "Compiler service error")
console.log('🧪 Judge0 URL:', JUDGE0_URL);

// NEW: one parameter of a function-style question, e.g. { name: 'nums', type: 'int[]' }
// ("type" has to be written as { type: String } inside a schema, otherwise Mongoose gets confused)
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

  // --- NEW: QUESTION TYPE ---
  // 'stdin'    = old style: the student writes the whole program (reads input, prints output)
  // 'function' = LeetCode style: the student writes only the method, we call it for them
  mode: { type: String, enum: ['stdin', 'function'], default: 'stdin' },
  functionName: { type: String, default: '' },   // e.g. twoSum
  returnType: { type: String, default: '' },     // e.g. int[]
  params: { type: [paramSchema], default: [] },  // e.g. [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }]

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



// ---- Parse a .md question file ----
// (The admin page now parses the .md in the browser and calls POST /api/problems,
//  so this older server-side parser is only used by POST /api/problems/upload below.)
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

// ---- Cap concurrent Judge0 jobs so 200 students can't overload it ----
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

// ---- Per-student cooldown between runs ----
const lastRun = new Map();
const cooldown = (ms) => (req, res, next) => {
  const now = Date.now();
  if (now - (lastRun.get(req.user.id) || 0) < ms) return res.status(429).json({ message: 'Please wait a few seconds before running again.' });
  lastRun.set(req.user.id, now);
  next();
};

async function judgeBatch(problem, code, language, cases) {
  // FIX: send the limits as real numbers and keep them inside Judge0's default maximums
  // (CPU time max 15 seconds, memory max 512000 KB). A value above the server's maximum
  // is one of the things that makes Judge0 answer "422".
  const cpuTime = Math.min(Number(problem.timeLimit) || 2, 15);
  const memory = Math.min(Number(problem.memoryLimit) || 256000, 512000);

  // NEW: function-style questions run "student's method + hidden driver" instead of the raw code
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
      // old style: Judge0 compares the output. Function style: WE compare the returned value (see checkFunctionResult)
      if (!isFn) sub.expected_output = b64(t.expectedOutput);
      return sub;
    })
  }, { headers: judge0Headers });

  // FIX: if Judge0 refused any of the submissions, stop here and show why instead of polling "undefined" tokens
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
          // compiler warnings of a program that compiled fine are not errors: only show compile output for a real compile error (status 6)
          stderr: unb64(s.stderr) || (s.status.id === 6 ? unb64(s.compile_output) : '')
        };
        return isFn ? checkFunctionResult(fnSpec, cases[i], r) : r;
      });
    }
  }
  throw new Error('Judge server timed out');
}

// NEW: for function-style questions. Judge0 only tells us the program RAN; here we read the value
// the hidden driver printed and compare it with the expected output of the test case.
function checkFunctionResult(spec, testCase, r) {
  // compile error / runtime error / time limit: keep Judge0's message, show anything the student printed
  if (!r.accepted) return { ...r, printed: r.stdout, stdout: '' };

  const got = harness.readResult(r.stdout, spec.returnType);
  const out = { ...r, printed: got.printed || '', stdout: '' };
  if (!got.found || got.error) {
    return { ...out, accepted: false, status: 'Runtime Error', stderr: 'Your function did not return a value. Do not call exit() or stop the program yourself.' };
  }
  out.stdout = harness.display(got.value); // shown to the student as "Your output"

  let expected;
  try { expected = harness.parseExpected(testCase.expectedOutput, spec.returnType); }
  catch (e) { return { ...out, accepted: false, status: 'Test Case Error', stderr: e.message }; }

  if (!harness.valuesMatch(got.value, expected, spec.returnType)) return { ...out, accepted: false, status: 'Wrong Answer' };
  return out;
}

// NEW: reads + checks the function-style settings sent by the admin page.
// Returns { error } (show it to the admin) or { fields } (save these on the Problem).
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
  // starter code for function-style questions is generated automatically, so nothing is stored
  return { fields: { mode: 'function', ...spec, starterCode: EMPTY_STARTER } };
};

const runCases = (problem, code, language, cases) =>
  withSlot(async () => {
    const out = [];
    for (let i = 0; i < cases.length; i += 20) out.push(...(await judgeBatch(problem, code, language, cases.slice(i, i + 20))));
    return out;
  });

// FIX: one helper used by BOTH /run and /submit.
// It prints the real Judge0 reason in this terminal AND returns it to the browser alert,
// e.g.  Compiler service error: Request failed with status code 422 - {"language_id":["..."]}
const judgeErrorMessage = (e) => {
  const d = e.response?.data;
  if (e.response) console.error('Judge0 error:', e.response.status, JSON.stringify(d));
  else console.error('Compiler error:', e.message);
  const detail = d ? (typeof d === 'string' ? d : JSON.stringify(d)) : '';
  return 'Compiler service error: ' + e.message + (detail ? ' - ' + detail : '');
};

// ---------- ADMIN ----------

// Create a question via the form builder (primary way now)
app.post('/api/problems', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  try {
    const { title, difficulty, points, timeLimit, statementMd, testCases, starterCode } = req.body;
    if (!title?.trim() || !statementMd?.trim()) return res.status(400).json({ message: 'Title and statement are required' });
    if (!Array.isArray(testCases) || testCases.length === 0) return res.status(400).json({ message: 'Add at least one test case' });
    // NEW: function-style settings (checked here so a bad signature never gets saved)
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

// Quick-import a question from a .md file (secondary / bulk path)
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

// FIX: this route MUST stay above '/api/problems/admin/:id'.
// Express reads routes from top to bottom, so when it was below, the word "submissions"
// was treated as an :id and caused the "Cast to ObjectId failed" error.
app.get('/api/problems/admin/submissions', verifyToken, async (req, res) => {
  if (!isAdminOrSuper(req)) return res.status(403).json({ message: 'Access denied' });
  const subs = await Submission.find().populate('user', 'name email').populate('problem', 'title points').sort({ createdAt: -1 }).limit(500);
  res.json(subs);
});

// Full detail for editing (includes hidden test cases + starter code, unlike the student-facing route)
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
    // NEW: function-style settings
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

// ---------- STUDENT ----------
app.get('/api/problems', verifyToken, async (req, res) => {
  try {
    // 'testCases' is only read to COUNT them; it is removed again below, so students never receive any test case
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
  // NEW: function-style questions get their starter code (class Solution + method) generated from the signature
  if (p.mode === 'function') obj.starterCode = harness.starterCode(harness.specOf(p));
  res.json(obj);
});

app.post('/api/problems/:slug/run', verifyToken, cooldown(3000), async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!LANG_IDS[language]) return res.status(400).json({ message: 'Unsupported language. Choose Java, Python or JavaScript.' });
    if (!code || code.length > 65536) return res.status(400).json({ message: 'Code is empty or too long' });
    const p = await Problem.findOne({ slug: req.params.slug });
    if (!p) return res.status(404).json({ message: 'Not found' });
    const samples = p.testCases.filter((t) => t.isSample);
    const results = await runCases(p, code, language, samples);
    res.json(results.map((r, i) => ({ ...r, input: samples[i].input, expected: samples[i].expectedOutput })));
  } catch (e) {
    // FIX: the old line used the name "err" which does not exist here (the variable is "e"),
    // so the error report itself crashed. Now it uses the shared helper above.
    res.status(500).json({ message: judgeErrorMessage(e) });
  }
});

app.post('/api/problems/:slug/submit', verifyToken, cooldown(5000), async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!LANG_IDS[language]) return res.status(400).json({ message: 'Unsupported language. Choose Java, Python or JavaScript.' });
    if (!code || code.length > 65536) return res.status(400).json({ message: 'Code is empty or too long' });
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

    // NEW: a report for every test case.
    //  - VISIBLE test cases show everything (input, expected output, the student's output, errors).
    //  - HIDDEN test cases only show pass/fail and the status. Their input, expected output and the
    //    student's output are never sent, so hidden tests cannot be read or hard-coded.
    const cases = results.map((r, i) => {
      const tc = p.testCases[i];
      const base = { n: i + 1, hidden: !tc.isSample, accepted: r.accepted, status: r.status, time: r.time };
      if (!tc.isSample) return base;
      return { ...base, input: tc.input, expected: tc.expectedOutput, stdout: r.stdout, printed: r.printed || '', stderr: r.stderr };
    });
    // a compile error does not depend on any test data, so it is safe (and useful) to show once
    const compileFail = results.find((r) => r.status === 'Compilation Error');

    res.json({ verdict: sub.verdict, passed, total, score: sub.score, points: p.points, cases, compileError: compileFail ? compileFail.stderr : '' });
  } catch (e) {
    // FIX: same shared helper as the /run route
    res.status(500).json({ message: judgeErrorMessage(e) });
  }
});
app.listen(port, () => {
  console.log(`🚀 SERVER VERSION 2.0 RUNNING ON PORT ${port}`);
});