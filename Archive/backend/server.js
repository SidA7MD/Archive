const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const helmet = require('helmet'); // Security middleware
const rateLimit = require('express-rate-limit'); // Rate limiting
require('dotenv').config();

const app = express();

// 1. Trust proxy for Render deployment
app.set('trust proxy', 1);

// 2. Configure Cloudinary with HTTPS enforcement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('☁️ Cloudinary configured with HTTPS');

// Test Cloudinary connection
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connection successful'))
  .catch(err => console.error('❌ Cloudinary connection failed:', err.message));

// 3. Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://larchive.tech',
    'https://www.larchive.tech',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://*.cloudinary.com", process.env.MONGODB_URI]
    }
  }
}));

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Upload rate limiting - more restrictive
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per 15 minutes
  message: 'Too many upload attempts, please try again later.',
});

// 6. MongoDB Atlas connection with modern options
const MONGO_URI = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

const mongooseOptions = {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000
};

console.log('🔄 Attempting to connect to MongoDB Atlas...');
console.log('Host:', process.env.MONGO_HOST);
console.log('Database:', process.env.MONGO_DB_NAME);
console.log('Username:', process.env.MONGO_USERNAME);

let isConnecting = false;
let reconnectTimeout;
let retryCount = 0;
const maxRetries = 5;

// IMPROVED: Simplified connection logic with better error handling
const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
    retryCount = 0;
    isConnecting = false;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    
    isConnecting = false;
    retryCount++;
    
    if (retryCount <= maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`🔄 Retrying connection in ${delay/1000} seconds... (attempt ${retryCount}/${maxRetries})`);
      reconnectTimeout = setTimeout(connectDB, delay);
    } else {
      console.error('❌ Max retry attempts reached. Please check your MongoDB configuration.');
    }
  }
};

// Initial connection
connectDB();

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
  if (!isConnecting && !reconnectTimeout && retryCount < maxRetries) {
    console.log('🔄 Attempting to reconnect...');
    reconnectTimeout = setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB Atlas');
});

// 7. Models
const Semester = require('./models/Semester');
const Type = require('./models/Type');
const Subject = require('./models/Subject');
const Year = require('./models/Year');
const File = require('./models/File');

// 8. Enhanced Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'university-archive/pdfs',
    format: 'pdf',
    public_id: (req, file) => {
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace('.pdf', '')
        .substring(0, 50);
      return `${Date.now()}-${sanitizedName}`;
    },
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    type: 'upload'
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// Middleware for database connection check
const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }
  next();
};

// Input validation middleware
const validateUploadData = (req, res, next) => {
  const { semester, type, subject, year } = req.body;
  
  if (!semester || !type || !subject || !year) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['semester', 'type', 'subject', 'year']
    });
  }

  // Validate year is a number
  if (isNaN(parseInt(year))) {
    return res.status(400).json({
      error: 'Year must be a valid number'
    });
  }

  next();
};

// 9. Enhanced file upload endpoint
app.post('/api/upload', uploadLimiter, requireDB, validateUploadData, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { semester, type, subject, year } = req.body;

    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find or create semester
        let semesterDoc = await Semester.findOne({ name: semester }).session(session);
        if (!semesterDoc) {
          throw new Error('Invalid semester');
        }

        // Find or create type
        let typeDoc = await Type.findOne({ 
          name: type, 
          semester: semesterDoc._id 
        }).session(session);
        
        if (!typeDoc) {
          const typeDisplayNames = {
            'cours': 'Cours',
            'tp': 'Travaux Pratiques',
            'td': 'Travaux Dirigés',
            'devoirs': 'Devoirs',
            'compositions': 'Compositions',
            'ratrapages': 'Rattrapages'
          };
          
          typeDoc = new Type({
            name: type,
            displayName: typeDisplayNames[type] || type,
            semester: semesterDoc._id
          });
          await typeDoc.save({ session });
        }

        // Find or create subject
        let subjectDoc = await Subject.findOne({
          name: subject,
          semester: semesterDoc._id,
          type: typeDoc._id
        }).session(session);
        
        if (!subjectDoc) {
          subjectDoc = new Subject({
            name: subject,
            semester: semesterDoc._id,
            type: typeDoc._id
          });
          await subjectDoc.save({ session });
        }

        // Find or create year
        let yearDoc = await Year.findOne({
          year: parseInt(year),
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id
        }).session(session);
        
        if (!yearDoc) {
          yearDoc = new Year({
            year: parseInt(year),
            semester: semesterDoc._id,
            type: typeDoc._id,
            subject: subjectDoc._id
          });
          await yearDoc.save({ session });
        }

        // Create file record with Cloudinary data
        const fileDoc = new File({
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.secure_url,
          cloudinaryPublicId: req.file.public_id,
          cloudinaryUrl: req.file.secure_url,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'cloudinary'
        });

        await fileDoc.save({ session });

        res.status(201).json({ 
          message: 'File uploaded successfully',
          file: {
            ...fileDoc.toObject(),
            viewUrl: req.file.secure_url,
            downloadUrl: req.file.secure_url.replace('/upload/', '/upload/fl_attachment/')
          }
        });
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file?.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
    }
    res.status(500).json({ error: 'File upload failed', message: error.message });
  }
});

// 10. Enhanced file viewing endpoint
app.get('/api/files/:id/view', requireDB, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${file.originalName}"`
    });
    res.redirect(file.cloudinaryUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// 11. Enhanced file download endpoint
app.get('/api/files/:id/download', requireDB, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const downloadUrl = file.cloudinaryUrl.includes('cloudinary.com') 
      ? file.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/')
      : file.cloudinaryUrl;

    res.redirect(downloadUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// 12. Enhanced admin routes with better pagination and filtering
app.get('/api/admin/files', requireDB, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.year) filter.year = req.query.year;

    const [files, total] = await Promise.all([
      File.find(filter)
        .populate(['semester', 'type', 'subject', 'year'])
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(filter)
    ]);

    res.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    });
  }
});

// PUT /api/files/:fileId - Update file metadata
app.put('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const { originalName, semester, type, subject, year } = req.body;
    
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Find or validate semester
    let semesterDoc = await Semester.findOne({ name: semester });
    if (!semesterDoc) {
      return res.status(400).json({ error: 'Invalid semester' });
    }

    // Find or create type
    let typeDoc = await Type.findOne({ name: type, semester: semesterDoc._id });
    if (!typeDoc) {
      const typeDisplayNames = {
        'cours': 'Cours',
        'tp': 'Travaux Pratiques',
        'td': 'Travaux Dirigés',
        'devoirs': 'Devoirs',
        'compositions': 'Compositions',
        'ratrapages': 'Rattrapages'
      };
      
      typeDoc = new Type({
        name: type,
        displayName: typeDisplayNames[type] || type,
        semester: semesterDoc._id
      });
      await typeDoc.save();
    }

    // Find or create subject
    let subjectDoc = await Subject.findOne({
      name: subject,
      semester: semesterDoc._id,
      type: typeDoc._id
    });
    if (!subjectDoc) {
      subjectDoc = new Subject({
        name: subject,
        semester: semesterDoc._id,
        type: typeDoc._id
      });
      await subjectDoc.save();
    }

    // Find or create year
    let yearDoc = await Year.findOne({
      year: parseInt(year),
      semester: semesterDoc._id,
      type: typeDoc._id,
      subject: subjectDoc._id
    });
    if (!yearDoc) {
      yearDoc = new Year({
        year: parseInt(year),
        semester: semesterDoc._id,
        type: typeDoc._id,
        subject: subjectDoc._id
      });
      await yearDoc.save();
    }

    // Update file metadata
    const updatedFile = await File.findByIdAndUpdate(
      req.params.fileId,
      {
        originalName,
        semester: semesterDoc._id,
        type: typeDoc._id,
        subject: subjectDoc._id,
        year: yearDoc._id,
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['semester', 'type', 'subject', 'year']);

    res.json({ message: 'File updated successfully', file: updatedFile });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      error: 'Failed to update file',
      message: error.message 
    });
  }
});

// DELETE /api/files/:fileId - Delete a file from both database and Cloudinary
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from Cloudinary
    try {
      if (file.cloudinaryPublicId) {
        const result = await cloudinary.uploader.destroy(file.cloudinaryPublicId, { 
          resource_type: 'raw' 
        });
        console.log('🗑️  Deleted from Cloudinary:', file.cloudinaryPublicId, result);
      }
    } catch (cloudinaryError) {
      console.warn('Warning: Could not delete file from Cloudinary:', cloudinaryError.message);
    }

    // Delete the file record from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error.message 
    });
  }
});

// Enhanced stats endpoint
app.get('/api/admin/stats', requireDB, async (req, res) => {
  try {
    const [
      totalFiles,
      totalSemesters,
      totalSubjects,
      totalSizeResult,
      filesByType,
      filesBySemester,
      recentUploads
    ] = await Promise.all([
      File.countDocuments(),
      Semester.countDocuments(),
      Subject.countDocuments(),
      File.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
      ]),
      File.aggregate([
        {
          $lookup: {
            from: 'types',
            localField: 'type',
            foreignField: '_id',
            as: 'typeInfo'
          }
        },
        { $unwind: '$typeInfo' },
        {
          $group: {
            _id: '$typeInfo.displayName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      File.aggregate([
        {
          $lookup: {
            from: 'semesters',
            localField: 'semester',
            foreignField: '_id',
            as: 'semesterInfo'
          }
        },
        { $unwind: '$semesterInfo' },
        {
          $group: {
            _id: '$semesterInfo.displayName',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      File.find()
        .populate(['semester', 'type', 'subject'])
        .sort({ uploadedAt: -1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      totalFiles,
      totalSemesters,
      totalSubjects,
      totalSize: totalSizeResult[0]?.totalSize || 0,
      filesByType,
      filesBySemester,
      recentUploads,
      storageProvider: 'Cloudinary'
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// 13. Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  let cloudinaryStatus = 'Unknown';
  let cloudinaryError = null;
  try {
    await cloudinary.api.ping();
    cloudinaryStatus = 'Connected';
  } catch (error) {
    cloudinaryStatus = 'Disconnected';
    cloudinaryError = error.message;
  }

  const overallStatus = (dbStatus === 1 && cloudinaryStatus === 'Connected') ? 'OK' : 'Warning';

  res.json({ 
    status: overallStatus,
    message: 'Server is running',
    services: {
      database: {
        status: dbStatusMap[dbStatus] || 'Unknown',
        host: process.env.MONGO_HOST,
        name: process.env.MONGO_DB_NAME,
        ...(dbStatus !== 1 && { error: 'Database connection issue' })
      },
      cloudinary: {
        status: cloudinaryStatus,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        ...(cloudinaryError && { error: cloudinaryError })
      }
    },
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Initialize default semesters
async function initializeSemesters() {
  try {
    const semesters = [
      { name: 'S1', displayName: 'Semestre 1', order: 1 },
      { name: 'S2', displayName: 'Semestre 2', order: 2 },
      { name: 'S3', displayName: 'Semestre 3', order: 3 },
      { name: 'S4', displayName: 'Semestre 4', order: 4 },
      { name: 'S5', displayName: 'Semestre 5', order: 5 },
      { name: 'S6', displayName: 'Semestre 6', order: 6 },
    ];
    
    for (const sem of semesters) {
      await Semester.findOneAndUpdate({ name: sem.name }, sem, { upsert: true, new: true });
    }
    console.log('📚 Initialized default semesters successfully.');
  } catch (error) {
    console.error('❌ Error initializing semesters:', error);
  }
}

// 14. Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  initializeSemesters();
});