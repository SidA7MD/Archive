const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// FIXED: Trust proxy for deployment platforms
app.set('trust proxy', 1);

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

// Enhanced Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Allow embedding of Cloudinary content
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com"],
      connectSrc: ["'self'", "https:", "*.cloudinary.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "*.cloudinary.com"],
      frameSrc: ["'self'", "*.cloudinary.com"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many upload attempts, please try again later.',
});

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://larchive.tech',
      'https://www.larchive.tech',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      // Add your frontend deployment URLs here
      /\.vercel\.app$/,
      /\.netlify\.app$/,
      /\.herokuapp\.com$/,
      /\.render\.com$/,
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.warn('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
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
  console.log('⚠️  Mongoose disconnected from MongoDB Atlas');
  if (!isConnecting && !reconnectTimeout && retryCount < maxRetries) {
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
    folder: 'university-archive/pdfs',
    format: async (req, file) => 'pdf',
    public_id: (req, file) => {
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace('.pdf', '')
        .substring(0, 50);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}-${sanitizedName}`;
    },
    resource_type: 'raw',
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

  if (isNaN(parseInt(year))) {
    return res.status(400).json({
      error: 'Year must be a valid number'
    });
  }

  next();
};

// Enhanced Routes

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

// GET /api/files - Enhanced endpoint for direct file access (for the FileCard component)
app.get('/api/files', requireDB, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.search) {
      filter.originalName = { $regex: req.query.search, $options: 'i' };
    }

    const [files, total] = await Promise.all([
      File.find(filter)
        .populate(['semester', 'type', 'subject', 'year'])
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(filter)
    ]);

    // Ensure Cloudinary URLs are HTTPS and accessible
    const enhancedFiles = files.map(file => ({
      ...file,
      // Ensure we always have HTTPS URLs
      cloudinaryUrl: file.cloudinaryUrl?.replace('http://', 'https://'),
      filePath: file.filePath?.replace('http://', 'https://'),
      // Add direct access URLs for the FileCard component
      viewUrl: file.cloudinaryUrl?.replace('http://', 'https://'),
      downloadUrl: file.cloudinaryUrl?.replace('http://', 'https://').replace('/upload/', '/upload/fl_attachment/'),
      storageProvider: 'cloudinary',
      // Add file type for better icon selection
      fileType: file.originalName?.split('.').pop()?.toLowerCase() || 'pdf'
    }));

    res.json({
      files: enhancedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      total
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    });
  }
});

// POST /api/upload - Upload PDF to Cloudinary with enhanced error handling
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

    const session = await mongoose.startSession();
    
    try {
      const { semester, type, subject, year } = req.body;
      
      console.log('📤 File uploaded to Cloudinary:', {
        filename: req.file.filename,
        public_id: req.file.public_id,
        url: req.file.secure_url,
        size: req.file.size
      });

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

        // Create file record with enhanced Cloudinary data
        const fileDoc = new File({
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.secure_url, // Always use HTTPS
          cloudinaryPublicId: req.file.public_id,
          cloudinaryUrl: req.file.secure_url, // Always use HTTPS
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'cloudinary',
          uploadedAt: new Date(),
          // Add metadata for better file management
          metadata: {
            width: req.file.width || null,
            height: req.file.height || null,
            format: req.file.format || 'pdf',
            resourceType: req.file.resource_type || 'raw'
          }
        });

        await fileDoc.save({ session });

        // Populate the saved document for response
        await fileDoc.populate(['semester', 'type', 'subject', 'year']);

        res.status(201).json({ 
          message: 'File uploaded successfully to Cloudinary',
          file: {
            ...fileDoc.toObject(),
            viewUrl: req.file.secure_url,
            downloadUrl: req.file.secure_url.replace('/upload/', '/upload/fl_attachment/'),
            fileType: req.file.originalname.split('.').pop()?.toLowerCase() || 'pdf'
          }
        });
      });
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
    } finally {
      await session.endSession();
    }
  });
});

// GET /api/files/:fileId/download - Enhanced download with better error handling
app.get('/api/files/:fileId/download', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId).lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file exists in Cloudinary before redirecting
    if (file.cloudinaryPublicId) {
      try {
        await cloudinary.api.resource(file.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (cloudinaryError) {
        if (cloudinaryError.http_code === 404) {
          return res.status(404).json({ 
            error: 'File no longer exists in storage',
            message: 'This file may have been deleted'
          });
        }
        throw cloudinaryError;
      }
    }

    // Force download with attachment flag
    const downloadUrl = file.cloudinaryUrl || file.filePath;
    const downloadUrlWithAttachment = downloadUrl.includes('cloudinary.com') 
      ? downloadUrl.replace('http://', 'https://').replace('/upload/', '/upload/fl_attachment/')
      : downloadUrl.replace('http://', 'https://');

    res.redirect(downloadUrlWithAttachment);
  } catch (error) {
    console.error('Error getting download link:', error);
    res.status(500).json({ 
      error: 'Failed to get download link',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/view - Enhanced view with better error handling
app.get('/api/files/:fileId/view', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId).lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file exists in Cloudinary
    if (file.cloudinaryPublicId) {
      try {
        await cloudinary.api.resource(file.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (cloudinaryError) {
        if (cloudinaryError.http_code === 404) {
          return res.status(404).json({ 
            error: 'File no longer exists in storage',
            message: 'This file may have been deleted'
          });
        }
        throw cloudinaryError;
      }
    }

    // Redirect to HTTPS Cloudinary URL for viewing
    const viewUrl = (file.cloudinaryUrl || file.filePath).replace('http://', 'https://');
    res.redirect(viewUrl);
  } catch (error) {
    console.error('Error getting view link:', error);
    res.status(500).json({ 
      error: 'Failed to get view link',
      message: error.message 
    });
  }
});

// Enhanced admin routes
app.get('/api/admin/files', requireDB, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.search) {
      filter.originalName = { $regex: req.query.search, $options: 'i' };
    }

    const [files, total] = await Promise.all([
      File.find(filter)
        .populate(['semester', 'type', 'subject', 'year'])
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(filter)
    ]);

    // Enhance files with direct URLs
    const enhancedFiles = files.map(file => ({
      ...file,
      cloudinaryUrl: file.cloudinaryUrl?.replace('http://', 'https://'),
      filePath: file.filePath?.replace('http://', 'https://'),
      viewUrl: file.cloudinaryUrl?.replace('http://', 'https://'),
      downloadUrl: file.cloudinaryUrl?.replace('http://', 'https://').replace('/upload/', '/upload/fl_attachment/'),
      fileType: file.originalName?.split('.').pop()?.toLowerCase() || 'pdf'
    }));

    res.json({
      files: enhancedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
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

    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find or validate semester
        let semesterDoc = await Semester.findOne({ name: semester }).session(session);
        if (!semesterDoc) {
          throw new Error('Invalid semester');
        }

        // Find or create type
        let typeDoc = await Type.findOne({ name: type, semester: semesterDoc._id }).session(session);
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
          { new: true, session }
        ).populate(['semester', 'type', 'subject', 'year']);

        res.json({ 
          message: 'File updated successfully', 
          file: {
            ...updatedFile.toObject(),
            viewUrl: updatedFile.cloudinaryUrl?.replace('http://', 'https://'),
            downloadUrl: updatedFile.cloudinaryUrl?.replace('http://', 'https://').replace('/upload/', '/upload/fl_attachment/'),
            fileType: updatedFile.originalName?.split('.').pop()?.toLowerCase() || 'pdf'
          }
        });
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      error: 'Failed to update file',
      message: error.message 
    });
  }
});

// DELETE /api/files/:fileId - Delete file from both database and Cloudinary
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from Cloudinary first
    let cloudinaryDeleted = false;
    if (file.cloudinaryPublicId) {
      try {
        const result = await cloudinary.uploader.destroy(file.cloudinaryPublicId, { 
          resource_type: 'raw' 
        });
        console.log('🗑️  Deleted from Cloudinary:', file.cloudinaryPublicId, result);
        cloudinaryDeleted = result.result === 'ok';
      } catch (cloudinaryError) {
        console.warn('Warning: Could not delete file from Cloudinary:', cloudinaryError.message);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete the file record from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ 
      message: 'File deleted successfully',
      cloudinaryDeleted,
      databaseDeleted: true
    });
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
      recentUploads,
      storageStats
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
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
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
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      File.find()
        .populate(['semester', 'type', 'subject'])
        .sort({ uploadedAt: -1 })
        .limit(10)
        .lean(),
      File.aggregate([
        {
          $group: {
            _id: '$storageProvider',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
          }
        }
      ])
    ]);

    // Format file sizes
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    res.json({
      overview: {
        totalFiles,
        totalSemesters,
        totalSubjects,
        totalSize: totalSizeResult[0]?.totalSize || 0,
        totalSizeFormatted: formatFileSize(totalSizeResult[0]?.totalSize || 0)
      },
      filesByType: filesByType.map(item => ({
        ...item,
        totalSizeFormatted: formatFileSize(item.totalSize)
      })),
      filesBySemester: filesBySemester.map(item => ({
        ...item,
        totalSizeFormatted: formatFileSize(item.totalSize)
      })),
      recentUploads: recentUploads.map(file => ({
        ...file,
        viewUrl: file.cloudinaryUrl?.replace('http://', 'https://'),
        downloadUrl: file.cloudinaryUrl?.replace('http://', 'https://').replace('/upload/', '/upload/fl_attachment/'),
        fileType: file.originalName?.split('.').pop()?.toLowerCase() || 'pdf',
        fileSizeFormatted: formatFileSize(file.fileSize || 0)
      })),
      storageStats: storageStats.map(stat => ({
        ...stat,
        totalSizeFormatted: formatFileSize(stat.totalSize)
      })),
      storageProvider: 'Cloudinary',
      cloudConfig: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder: 'university-archive/pdfs'
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Health check endpoint with comprehensive status
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
  let cloudinaryError = null;
  let cloudinaryDetails = {};
  
  try {
    const pingResult = await cloudinary.api.ping();
    cloudinaryStatus = 'Connected';
    cloudinaryDetails = {
      status: pingResult.status,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    };
  } catch (error) {
    cloudinaryStatus = 'Disconnected';
    cloudinaryError = error.message;
  }

  // Check file count for basic functionality
  let fileCount = 0;
  let dbError = null;
  
  if (dbStatus === 1) {
    try {
      fileCount = await File.countDocuments();
    } catch (error) {
      dbError = error.message;
    }
  }

  const overallStatus = (dbStatus === 1 && cloudinaryStatus === 'Connected') ? 'OK' : 'Warning';

  res.status(overallStatus === 'OK' ? 200 : 503).json({ 
    status: overallStatus,
    message: `Server is ${overallStatus === 'OK' ? 'healthy' : 'experiencing issues'}`,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatusMap[dbStatus] || 'Unknown',
        host: process.env.MONGO_HOST,
        name: process.env.MONGO_DB_NAME,
        fileCount: dbStatus === 1 ? fileCount : null,
        ...(dbError && { error: dbError }),
        ...(dbStatus !== 1 && { error: 'Database connection issue' })
      },
      cloudinary: {
        status: cloudinaryStatus,
        ...cloudinaryDetails,
        ...(cloudinaryError && { error: cloudinaryError })
      },
      storage: {
        provider: 'Cloudinary',
        folder: 'university-archive/pdfs',
        status: cloudinaryStatus
      }
    },
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version
  });
});

// Bulk operations for admin
app.post('/api/admin/files/bulk-delete', requireDB, async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'No file IDs provided' });
    }

    // Validate all IDs
    const invalidIds = fileIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid file IDs',
        invalidIds 
      });
    }

    // Find all files to be deleted
    const files = await File.find({ _id: { $in: fileIds } });
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    let cloudinaryDeleted = 0;
    let cloudinaryFailed = 0;
    const failedDeletions = [];

    // Delete from Cloudinary
    for (const file of files) {
      if (file.cloudinaryPublicId) {
        try {
          const result = await cloudinary.uploader.destroy(file.cloudinaryPublicId, { 
            resource_type: 'raw' 
          });
          if (result.result === 'ok') {
            cloudinaryDeleted++;
          } else {
            cloudinaryFailed++;
            failedDeletions.push({
              fileId: file._id,
              fileName: file.originalName,
              error: 'Cloudinary deletion failed'
            });
          }
        } catch (error) {
          cloudinaryFailed++;
          failedDeletions.push({
            fileId: file._id,
            fileName: file.originalName,
            error: error.message
          });
        }
      }
    }

    // Delete from database
    const deleteResult = await File.deleteMany({ _id: { $in: fileIds } });

    res.json({
      message: 'Bulk deletion completed',
      summary: {
        requested: fileIds.length,
        found: files.length,
        deletedFromDatabase: deleteResult.deletedCount,
        deletedFromCloudinary: cloudinaryDeleted,
        cloudinaryFailed,
        failedDeletions
      }
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ 
      error: 'Failed to delete files',
      message: error.message 
    });
  }
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
    console.log('📚 Semesters initialization completed');
  } catch (error) {
    console.error('❌ Error initializing semesters:', error);
  }
}

// Enhanced cleanup function for orphaned file records
async function cleanupOrphanedFiles() {
  try {
    console.log('🧹 Starting cleanup of orphaned files...');
    
    const files = await File.find({}).lean();
    let cleaned = 0;
    let checked = 0;
    
    console.log(`📋 Found ${files.length} files to verify`);
    
    for (const file of files) {
      checked++;
      
      // For Cloudinary files, check if they exist
      if (file.cloudinaryPublicId) {
        try {
          await cloudinary.api.resource(file.cloudinaryPublicId, { 
            resource_type: 'raw' 
          });
          
          // File exists, optionally log progress
          if (checked % 100 === 0) {
            console.log(`✓ Verified ${checked}/${files.length} files...`);
          }
        } catch (error) {
          if (error.http_code === 404) {
            // File doesn't exist in Cloudinary, remove from database
            await File.findByIdAndDelete(file._id);
            cleaned++;
            console.log(`🗑️  Cleaned orphaned file record: ${file.originalName} (${file.cloudinaryPublicId})`);
          } else {
            console.warn(`⚠️  Error checking file ${file.originalName}:`, error.message);
          }
        }
      } else {
        // File without Cloudinary ID - might be legacy, check if URL is accessible
        if (file.filePath && !file.filePath.includes('cloudinary.com')) {
          console.log(`🔍 Found legacy file without Cloudinary ID: ${file.originalName}`);
          // Optionally mark for manual review or migration
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`✅ Cleanup completed: ${cleaned} orphaned file records removed`);
    } else {
      console.log('✅ No orphaned files found');
    }
    
    return { checked, cleaned };
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return { checked: 0, cleaned: 0, error: error.message };
  }
}

// Cloudinary webhook handler (optional, for advanced file management)
app.post('/api/webhooks/cloudinary', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature if configured
    // const signature = req.headers['x-cld-signature'];
    // const timestamp = req.headers['x-cld-timestamp'];
    
    const event = JSON.parse(req.body.toString());
    
    console.log('📡 Cloudinary webhook received:', event.notification_type);
    
    // Handle different webhook events
    switch (event.notification_type) {
      case 'upload':
        console.log('📤 File uploaded to Cloudinary:', event.public_id);
        break;
        
      case 'delete':
        console.log('🗑️  File deleted from Cloudinary:', event.public_id);
        // Optionally remove from database if not already done
        const deletedFile = await File.findOneAndDelete({ 
          cloudinaryPublicId: event.public_id 
        });
        if (deletedFile) {
          console.log('🗑️  Corresponding database record removed');
        }
        break;
        
      case 'rename':
        console.log('✏️  File renamed in Cloudinary:', {
          from: event.public_id,
          to: event.to_public_id
        });
        // Update database record
        await File.findOneAndUpdate(
          { cloudinaryPublicId: event.public_id },
          { cloudinaryPublicId: event.to_public_id }
        );
        break;
        
      default:
        console.log('📡 Unhandled webhook event:', event.notification_type);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Graceful shutdown handler
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
  console.error('💥 Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(error.status || 500).json({ 
    error: 'Internal server error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  console.log(`📍 Route not found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/files',
      'GET /api/semesters',
      'POST /api/upload',
      'GET /api/files/:id/view',
      'GET /api/files/:id/download'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n☁️  University Archive Server (Enhanced Cloudinary Edition)`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://archive-mi73.onrender.com' : `http://localhost:${PORT}`}`);
  console.log(`☁️  File Storage: Cloudinary (${process.env.CLOUDINARY_CLOUD_NAME})`);
  console.log(`🛡️  Security: Helmet + Rate Limiting enabled`);
  console.log(`🔄 Proxy Trust: Enabled for deployment platforms`);
  console.log(`🌐 CORS: Enhanced with dynamic origin validation`);
  
  // Wait for database connection before initializing
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForDB);
      
      console.log('🔧 Initializing application...');
      
      await initializeSemesters();
      
      // Run cleanup on startup (but don't wait for it)
      cleanupOrphanedFiles()
        .then(result => {
          if (result.error) {
            console.log('⚠️  Cleanup completed with errors:', result.error);
          } else {
            console.log(`✅ Startup cleanup: ${result.checked} files checked, ${result.cleaned} orphaned records removed`);
          }
        })
        .catch(error => {
          console.error('❌ Startup cleanup failed:', error.message);
        });
      
      console.log('🎯 Server ready to accept connections');
      console.log('📤 Files will be uploaded to Cloudinary cloud storage');
      console.log('📊 Admin panel: /api/admin/stats');
      console.log('🔍 Health check: /api/health');
      
      // Log environment-specific info
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Running in PRODUCTION mode');
      } else {
        console.log('🛠️  Running in DEVELOPMENT mode');
        console.log(`📝 API Documentation available at http://localhost:${PORT}/api/health`);
      }
    }
  }, 1000);
  
  // Timeout after 30 seconds
  setTimeout(() => {
    clearInterval(waitForDB);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Started without database connection - some features may be limited');
    }
  }, 30000);
});