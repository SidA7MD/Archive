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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️  Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***configured***' : 'missing'
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connection successful'))
  .catch(err => console.error('❌ Cloudinary connection failed:', err.message));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Atlas connection with better error handling and retry logic
const MONGO_URI = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

const mongooseOptions = {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  bufferMaxEntries: 0
};

console.log('🔄 Attempting to connect to MongoDB Atlas...');
console.log('Host:', process.env.MONGO_HOST);
console.log('Database:', process.env.MONGO_DB_NAME);
console.log('Username:', process.env.MONGO_USERNAME);

let isConnecting = false;
let reconnectTimeout;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
    isConnecting = false;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    isConnecting = false;
    
    // Retry connection after delay
    console.log('🔄 Retrying connection in 5 seconds...');
    reconnectTimeout = setTimeout(connectDB, 5000);
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
  console.log('⚠️  Mongoose disconnected from MongoDB Atlas');
  if (!isConnecting && !reconnectTimeout) {
    console.log('🔄 Attempting to reconnect...');
    reconnectTimeout = setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB Atlas');
});

// Models
const Semester = require('./models/Semester');
const Type = require('./models/Type');
const Subject = require('./models/Subject');
const Year = require('./models/Year');
const File = require('./models/File');

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'university-archive/pdfs', // Folder in Cloudinary
    format: async (req, file) => 'pdf', // supports promises as well
    public_id: (req, file) => {
      // Generate unique filename
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace('.pdf', '')
        .substring(0, 50);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}-${sanitizedName}`;
    },
    resource_type: 'raw', // Use 'raw' for non-image files like PDFs
    allowed_formats: ['pdf'],
  },
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
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

// Routes with enhanced error handling

// GET /api/semesters - List all semesters
app.get('/api/semesters', requireDB, async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ order: 1 }).lean();
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ 
      error: 'Failed to fetch semesters',
      message: error.message 
    });
  }
});

// GET /api/semesters/:semesterId/types - List types by semester
app.get('/api/semesters/:semesterId/types', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.semesterId)) {
      return res.status(400).json({ error: 'Invalid semester ID' });
    }

    const types = await Type.find({ semester: req.params.semesterId })
      .populate('semester')
      .lean();
    res.json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ 
      error: 'Failed to fetch types',
      message: error.message 
    });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects - List subjects
app.get('/api/semesters/:semesterId/types/:typeId/subjects', requireDB, async (req, res) => {
  try {
    const { semesterId, typeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(semesterId) || 
        !mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({ error: 'Invalid semester or type ID' });
    }

    const subjects = await Subject.find({
      semester: semesterId,
      type: typeId
    }).populate(['semester', 'type']).lean();
    
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subjects',
      message: error.message 
    });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years
app.get('/api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years', requireDB, async (req, res) => {
  try {
    const { semesterId, typeId, subjectId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(semesterId) || 
        !mongoose.Types.ObjectId.isValid(typeId) ||
        !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    const years = await Year.find({
      semester: semesterId,
      type: typeId,
      subject: subjectId
    }).populate(['semester', 'type', 'subject'])
      .sort({ year: -1 })
      .lean();
      
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ 
      error: 'Failed to fetch years',
      message: error.message 
    });
  }
});

// GET /api/years/:yearId/files - List files by year
app.get('/api/years/:yearId/files', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.yearId)) {
      return res.status(400).json({ error: 'Invalid year ID' });
    }

    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();
      
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    });
  }
});

// POST /api/upload - Upload a PDF file to Cloudinary
app.post('/api/upload', uploadLimiter, requireDB, validateUploadData, (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    try {
      const { semester, type, subject, year } = req.body;
      
      console.log('📤 File uploaded to Cloudinary:', {
        filename: req.file.filename,
        public_id: req.file.public_id,
        url: req.file.path,
        size: req.file.size
      });

      // Use MongoDB session for transaction
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
            filePath: req.file.path, // Cloudinary URL
            cloudinaryPublicId: req.file.public_id, // Store Cloudinary public ID
            cloudinaryUrl: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            semester: semesterDoc._id,
            type: typeDoc._id,
            subject: subjectDoc._id,
            year: yearDoc._id
          });
          await fileDoc.save({ session });

          res.status(201).json({ 
            message: 'File uploaded successfully to Cloudinary', 
            file: fileDoc 
          });
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Clean up Cloudinary file on error
      if (req.file && req.file.public_id) {
        try {
          await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
          console.log('🗑️  Cleaned up Cloudinary file:', req.file.public_id);
        } catch (cleanupError) {
          console.error('Error cleaning up Cloudinary file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to upload file',
        message: error.message 
      });
    }
  });
});

// GET /api/files/:fileId/download - Redirect to Cloudinary URL for download
app.get('/api/files/:fileId/download', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId).lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // For Cloudinary files, we can force download by adding fl_attachment parameter
    const downloadUrl = file.cloudinaryUrl || file.filePath;
    const downloadUrlWithAttachment = downloadUrl.includes('cloudinary.com') 
      ? downloadUrl.replace('/upload/', '/upload/fl_attachment/')
      : downloadUrl;

    // Redirect to Cloudinary download URL
    res.redirect(downloadUrlWithAttachment);
  } catch (error) {
    console.error('Error getting download link:', error);
    res.status(500).json({ 
      error: 'Failed to get download link',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/view - Redirect to Cloudinary URL for viewing
app.get('/api/files/:fileId/view', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId).lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Redirect to Cloudinary URL for viewing
    const viewUrl = file.cloudinaryUrl || file.filePath;
    res.redirect(viewUrl);
  } catch (error) {
    console.error('Error getting view link:', error);
    res.status(500).json({ 
      error: 'Failed to get view link',
      message: error.message 
    });
  }
});

// Enhanced admin routes with better pagination and filtering
app.get('/api/admin/files', requireDB, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
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

// Health check endpoint with Cloudinary status
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  // Test Cloudinary connection
  let cloudinaryStatus = 'Unknown';
  try {
    await cloudinary.api.ping();
    cloudinaryStatus = 'Connected';
  } catch (error) {
    cloudinaryStatus = 'Disconnected';
  }

  const overallStatus = (dbStatus === 1 && cloudinaryStatus === 'Connected') ? 'OK' : 'Warning';

  res.json({ 
    status: overallStatus,
    message: 'Server is running',
    services: {
      database: {
        status: dbStatusMap[dbStatus] || 'Unknown',
        host: process.env.MONGO_HOST,
        name: process.env.MONGO_DB_NAME
      },
      cloudinary: {
        status: cloudinaryStatus,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME
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
      { name: 'S5', displayName: 'Semestre 5', order: 5 }
    ];

    for (const sem of semesters) {
      const existing = await Semester.findOne({ name: sem.name });
      if (!existing) {
        await new Semester(sem).save();
        console.log(`✅ Created semester: ${sem.displayName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing semesters:', error);
  }
}

// Cleanup function for orphaned file records (Cloudinary cleanup)
async function cleanupOrphanedFiles() {
  try {
    const files = await File.find({}).lean();
    let cleaned = 0;
    
    for (const file of files) {
      // For Cloudinary files, we can check if the public_id exists
      if (file.cloudinaryPublicId) {
        try {
          await cloudinary.api.resource(file.cloudinaryPublicId, { resource_type: 'raw' });
        } catch (error) {
          if (error.http_code === 404) {
            // File doesn't exist in Cloudinary, remove from database
            await File.findByIdAndDelete(file._id);
            cleaned++;
            console.log(`🗑️  Cleaned orphaned file record: ${file.originalName}`);
          }
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`✅ Cleaned ${cleaned} orphaned file records`);
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB Atlas connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  
  console.log('👋 Server shutdown complete');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(error.status || 500).json({ 
    error: 'Internal server error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n☁️  University Archive Server (Cloudinary Edition)`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
  console.log(`☁️  File Storage: Cloudinary (${process.env.CLOUDINARY_CLOUD_NAME})`);
  
  // Wait for database connection before initializing
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForDB);
      
      await initializeSemesters();
      console.log('✅ Default semesters initialized');
      
      // Run cleanup on startup
      await cleanupOrphanedFiles();
      
      console.log('🎯 Server ready to accept connections');
      console.log('📤 Files will be uploaded to Cloudinary cloud storage');
    }
  }, 1000);
  
  // Timeout after 30 seconds
  setTimeout(() => {
    clearInterval(waitForDB);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Started without database connection');
    }
  }, 30000);
});