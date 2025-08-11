const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Atlas connection with proper options
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

console.log('Attempting to connect to MongoDB Atlas...');
console.log('Host:', process.env.MONGO_HOST);
console.log('Database:', process.env.MONGO_DB_NAME);
console.log('Username:', process.env.MONGO_USERNAME);

// Improved connection options
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferCommands: false // Disable mongoose buffering
    });
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    // Initialize semesters after successful connection
    await initializeSemesters();
    console.log('✅ Default semesters initialized');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.error('Connection string (without password):', MONGO_URI.replace(process.env.MONGO_PASSWORD, '****'));
    
    // Exit process on connection failure to prevent infinite loops
    process.exit(1);
  }
};

// Connection event listeners (simplified to prevent loops)
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB Atlas');
});

// Models
const Semester = require('./models/Semester');
const Type = require('./models/Type');
const Subject = require('./models/Subject');
const Year = require('./models/Year');
const File = require('./models/File');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Add middleware to handle CORS for mobile apps
app.use('/api/files', (req, res, next) => {
  // Allow mobile apps to access file endpoints
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges, User-Agent');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Utility function to detect mobile browsers
const isMobileDevice = (userAgent) => {
  return /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent || '');
};

const isIOSDevice = (userAgent) => {
  return /iPhone|iPad|iPod/i.test(userAgent || '');
};

const isSafari = (userAgent) => {
  return /Safari/i.test(userAgent || '') && !/Chrome/i.test(userAgent || '');
};

// Routes with improved error handling

// GET /api/semesters - List all semesters
app.get('/api/semesters', async (req, res) => {
  try {
    // Check database connection before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const semesters = await Semester.find().sort({ order: 1 }).lean();
    console.log('Semesters fetched successfully:', semesters.length, 'items');
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
app.get('/api/semesters/:semesterId/types', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
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
app.get('/api/semesters/:semesterId/types/:typeId/subjects', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const subjects = await Subject.find({
      semester: req.params.semesterId,
      type: req.params.typeId
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
app.get('/api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const years = await Year.find({
      semester: req.params.semesterId,
      type: req.params.typeId,
      subject: req.params.subjectId
    }).populate(['semester', 'type', 'subject']).sort({ year: -1 }).lean();
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
app.get('/api/years/:yearId/files', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year'])
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

// POST /api/upload - Upload a PDF file
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const { semester, type, subject, year } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Find or create semester
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
        displayName: typeDisplayNames[type],
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
      year: year,
      semester: semesterDoc._id,
      type: typeDoc._id,
      subject: subjectDoc._id
    });
    if (!yearDoc) {
      yearDoc = new Year({
        year: year,
        semester: semesterDoc._id,
        type: typeDoc._id,
        subject: subjectDoc._id
      });
      await yearDoc.save();
    }

    // Create file record
    const fileDoc = new File({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      semester: semesterDoc._id,
      type: typeDoc._id,
      subject: subjectDoc._id,
      year: yearDoc._id
    });
    await fileDoc.save();

    res.status(201).json({ message: 'File uploaded successfully', file: fileDoc });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/download - Download a file (mobile-optimized)
app.get('/api/files/:fileId/download', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Detect mobile browsers
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = isMobileDevice(userAgent);
    
    // Get file stats for Content-Length
    const stat = fs.statSync(file.filePath);
    
    // Set download headers
    res.set({
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes'
    });

    // For mobile devices, add additional headers to ensure proper download
    if (isMobile) {
      res.set({
        'X-Suggested-Filename': file.originalName,
        'Access-Control-Expose-Headers': 'Content-Disposition, X-Suggested-Filename'
      });
    }

    // Use res.download for better mobile compatibility
    res.download(file.filePath, file.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to download file',
            message: err.message 
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      error: 'Failed to download file',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/view - View a file (mobile-optimized)
app.get('/api/files/:fileId/view', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Detect mobile browsers
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = isMobileDevice(userAgent);
    const isIOS = isIOSDevice(userAgent);
    const isSafariBrowser = isSafari(userAgent);
    
    // Set appropriate headers for mobile devices
    if (file.mimeType === 'application/pdf') {
      if (isMobile) {
        // For mobile devices, especially iOS, set headers to force download or proper handling
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // iOS Safari specific headers
          'X-Content-Type-Options': 'nosniff',
          // Force Safari to handle PDF properly
          'Accept-Ranges': 'bytes'
        });
        
        if (isIOS && isSafariBrowser) {
          // For iOS Safari, sometimes setting as attachment works better
          res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        }
      } else {
        // Desktop browsers - inline display
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
        });
      }
    } else {
      // Non-PDF files
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      });
    }

    // Send the file
    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ 
      error: 'Failed to view file',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/stream - Stream a file for mobile devices with range support
app.get('/api/files/:fileId/stream', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const stat = fs.statSync(file.filePath);
    const range = req.headers.range;

    if (range) {
      // Handle range requests for mobile browsers
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      
      const fileStream = fs.createReadStream(file.filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mimeType || 'application/pdf',
        'Cache-Control': 'no-cache'
      });
      
      fileStream.pipe(res);
    } else {
      // No range request - send full file
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': file.mimeType || 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      });
      
      fs.createReadStream(file.filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ 
      error: 'Failed to stream file',
      message: error.message 
    });
  }
});

// GET /api/files/:fileId/info - Get file information
app.get('/api/files/:fileId/info', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        status: 'Service Unavailable' 
      });
    }

    const file = await File.findById(req.params.fileId)
      .populate(['semester', 'type', 'subject', 'year'])
      .lean();
      
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    const fileExists = fs.existsSync(file.filePath);
    
    const fileInfo = {
      ...file,
      exists: fileExists,
      downloadUrl: `/api/files/${file._id}/download`,
      viewUrl: `/api/files/${file._id}/view`,
      streamUrl: `/api/files/${file._id}/stream`
    };

    res.json(fileInfo);
  } catch (error) {
    console.error('Error fetching file info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file info',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({ 
    status: dbStatus === 1 ? 'OK' : 'DEGRADED', 
    message: 'Server is running',
    database: dbStatusText[dbStatus] || 'Unknown',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'Unknown',
    isMobile: isMobileDevice(req.headers['user-agent'])
  });
});

// Initialize default semesters (improved to prevent duplicates)
async function initializeSemesters() {
  try {
    console.log('Initializing semesters...');
    
    const semesters = [
      { name: 'S1', displayName: 'Semestre 1', order: 1 },
      { name: 'S2', displayName: 'Semestre 2', order: 2 },
      { name: 'S3', displayName: 'Semestre 3', order: 3 },
      { name: 'S4', displayName: 'Semestre 4', order: 4 },
      { name: 'S5', displayName: 'Semestre 5', order: 5 }
    ];

    // Use insertMany with ordered: false to handle duplicates gracefully
    const existingCount = await Semester.countDocuments();
    
    if (existingCount === 0) {
      await Semester.insertMany(semesters, { ordered: false });
      console.log('✅ All semesters created successfully');
    } else {
      console.log(`ℹ️  Found ${existingCount} existing semesters, skipping initialization`);
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Some semesters already exist, continuing...');
    } else {
      console.error('❌ Error initializing semesters:', error.message);
      throw error;
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB Atlas connection closed.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB Atlas connection closed.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start server after database connection is established
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 Mobile-optimized PDF handling enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();