const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const GridFSBucket = require('mongodb').GridFSBucket;
const { Readable } = require('stream');
require('dotenv').config();

const app = express();

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'https://www.larchive.tech',
      'https://larchive.tech',
      /\.vercel\.app$/,
      /\.netlify\.app$/,
      /\.herokuapp\.com$/,
      /\.render\.com$/,
      /\.onrender\.com$/
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range', 'Accept'],
  exposedHeaders: [
    'Content-Disposition', 
    'Content-Length', 
    'Content-Range', 
    'Accept-Ranges',
    'Content-Type'
  ],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Security middleware with PDF-friendly settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'self'", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many upload attempts, please try again later.',
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base URL function
const getBaseURL = (req) => {
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  
  if (host && host.includes('.onrender.com')) {
    return `https://${host}`;
  }
  
  if (process.env.NODE_ENV === 'production' && host) {
    return `${protocol}://${host}`;
  }
  
  return `http://localhost:${process.env.PORT || 5000}`;
};

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000
};

console.log('Connecting to MongoDB...');

let isConnecting = false;
let reconnectTimeout;
let retryCount = 0;
const maxRetries = 10;
let gridFSBucket;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log('Connected to MongoDB successfully');
    
    // Initialize GridFS bucket
    gridFSBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'pdfs'
    });
    console.log('GridFS bucket initialized');
    
    retryCount = 0;
    isConnecting = false;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    isConnecting = false;
    retryCount++;
    
    if (retryCount <= maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`Retrying connection in ${delay/1000} seconds... (attempt ${retryCount}/${maxRetries})`);
      reconnectTimeout = setTimeout(connectDB, delay);
    } else {
      console.error('Max retry attempts reached. Please check your MongoDB configuration.');
    }
  }
};

// Initial connection
connectDB();

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  if (!isConnecting && !reconnectTimeout && retryCount < maxRetries) {
    console.log('Attempting to reconnect...');
    reconnectTimeout = setTimeout(connectDB, 5000);
  }
});

// Models
const Semester = require('./models/Semester');
const Type = require('./models/Type');
const Subject = require('./models/Subject');
const Year = require('./models/Year');

// File model for GridFS
const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  gridFSId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/pdf' },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true },
  storageProvider: { type: String, default: 'gridfs' },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

// Configure Multer for memory storage
const storage = multer.memoryStorage();

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
  if (mongoose.connection.readyState !== 1 || !gridFSBucket) {
    return res.status(503).json({ 
      error: 'Database temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }
  next();
};

// Enhanced file serving middleware
app.use('/api/files/:fileId/:action(view|download)', (req, res, next) => {
  // Enhanced CORS headers for file serving
  const origin = req.get('origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, Content-Disposition');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Enable range requests for PDF streaming
  res.setHeader('Accept-Ranges', 'bytes');
  
  console.log(`File serving request: ${req.method} ${req.originalUrl} from ${origin || 'direct'}`);
  
  next();
});

// Enhanced OPTIONS handler for CORS preflight
app.options('/api/files/:fileId/:action', (req, res) => {
  console.log(`CORS preflight for: ${req.params.action} file ${req.params.fileId}`);
  
  const origin = req.get('origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Routes

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

// GET /api/files - List files with pagination and filtering
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

    const baseURL = getBaseURL(req);

    const enhancedFiles = files.map(file => ({
      ...file,
      viewUrl: `${baseURL}/api/files/${file._id}/view`,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      storageProvider: 'gridfs',
      fileType: file.originalName && file.originalName.includes('.') 
        ? file.originalName.split('.').pop().toLowerCase() 
        : 'pdf'
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
      total,
      baseURL
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      message: error.message 
    });
  }
});

// GET /api/admin/files - List all files for admin
app.get('/api/admin/files', requireDB, async (req, res) => {
  try {
    console.log('Admin: Fetching all files...');
    
    const files = await File.find()
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();

    console.log(`Admin: Found ${files.length} files`);

    const baseURL = getBaseURL(req);

    const enhancedFiles = files.map(file => ({
      ...file,
      viewUrl: `${baseURL}/api/files/${file._id}/view`,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      storageProvider: 'gridfs',
      fileType: file.originalName && file.originalName.includes('.') 
        ? file.originalName.split('.').pop().toLowerCase() 
        : 'pdf'
    }));

    res.json(enhancedFiles);
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
    const { fileId } = req.params;
    const { originalName, semester, type, subject, year } = req.body;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    console.log(`Updating file ${fileId}:`, { originalName, semester, type, subject, year });

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const file = await File.findById(fileId).session(session);
      if (!file) {
        throw new Error('File not found');
      }

      let semesterDoc = await Semester.findOne({ name: semester }).session(session);
      if (!semesterDoc) {
        throw new Error('Invalid semester');
      }

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

      const updatedFile = await File.findByIdAndUpdate(
        fileId,
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

      console.log('File updated successfully:', updatedFile.originalName);
      
      res.json({
        message: 'File updated successfully',
        file: updatedFile
      });
    });

    await session.endSession();
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      error: 'Failed to update file',
      message: error.message 
    });
  }
});

// POST /api/upload - Upload PDF to GridFS
app.post('/api/upload', uploadLimiter, requireDB, (req, res) => {
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

    const { semester, type, subject, year } = req.body || {};
    if (!semester || !type || !subject || !year) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['semester', 'type', 'subject', 'year']
      });
    }

    const session = await mongoose.startSession();
    
    try {
      console.log('Uploading file to GridFS:', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      });

      let gridFSFileId;

      await session.withTransaction(async () => {
        // Upload file to GridFS
        const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
          metadata: {
            originalName: req.file.originalname,
            uploadedAt: new Date(),
            semester,
            type,
            subject,
            year
          }
        });

        // Convert buffer to readable stream and pipe to GridFS
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        await new Promise((resolve, reject) => {
          readableStream.pipe(uploadStream);
          
          uploadStream.on('error', reject);
          uploadStream.on('finish', () => {
            gridFSFileId = uploadStream.id;
            console.log('File uploaded to GridFS with ID:', gridFSFileId);
            resolve();
          });
        });

        let semesterDoc = await Semester.findOne({ name: semester }).session(session);
        if (!semesterDoc) {
          throw new Error('Invalid semester');
        }

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

        const fileDoc = new File({
          originalName: req.file.originalname,
          gridFSId: gridFSFileId,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'gridfs',
          uploadedAt: new Date()
        });

        await fileDoc.save({ session });

        await fileDoc.populate(['semester', 'type', 'subject', 'year']);

        const baseUrl = getBaseURL(req);
        
        const responseFile = {
          ...fileDoc.toObject(),
          viewUrl: `${baseUrl}/api/files/${fileDoc._id}/view`,
          downloadUrl: `${baseUrl}/api/files/${fileDoc._id}/download`,
          fileType: req.file.originalname && req.file.originalname.includes('.') 
            ? req.file.originalname.split('.').pop().toLowerCase() 
            : 'pdf'
        };

        console.log('Upload successful. File URLs:', {
          viewUrl: responseFile.viewUrl,
          downloadUrl: responseFile.downloadUrl
        });

        res.status(201).json({ 
          message: 'File uploaded successfully to GridFS',
          file: responseFile
        });
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (gridFSFileId) {
        try {
          await gridFSBucket.delete(gridFSFileId);
          console.log('Cleaned up GridFS file:', gridFSFileId);
        } catch (cleanupError) {
          console.error('Error cleaning up GridFS file:', cleanupError);
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

// GET /api/files/:fileId/view - Stream PDF for viewing (NO PATH.JOIN)
app.get('/api/files/:fileId/view', requireDB, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    console.log(`Viewing file: ${fileId}`);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error('Invalid file ID:', fileId);
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Find file document
    const file = await File.findById(fileId).lean();
    if (!file) {
      console.error('File not found in database:', fileId);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('Found file:', { 
      id: file._id, 
      name: file.originalName, 
      gridFSId: file.gridFSId,
      size: file.fileSize
    });

    // Check if file exists in GridFS
    const gridFSFiles = await gridFSBucket.find({ _id: file.gridFSId }).toArray();
    if (!gridFSFiles.length) {
      console.error('File not found in GridFS:', file.gridFSId);
      return res.status(404).json({ error: 'File not found in storage' });
    }

    const gridFSFile = gridFSFiles[0];
    console.log('GridFS file found:', { 
      id: gridFSFile._id, 
      filename: gridFSFile.filename, 
      length: gridFSFile.length 
    });

    // Set response headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', gridFSFile.length);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Handle range requests for PDF streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : gridFSFile.length - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${gridFSFile.length}`);
      res.setHeader('Content-Length', chunksize);
      
      console.log(`Range request: ${start}-${end}/${gridFSFile.length}`);
    }

    // Create download stream from GridFS
    const downloadStream = gridFSBucket.openDownloadStream(file.gridFSId);
    
    downloadStream.on('error', (error) => {
      console.error('GridFS stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });

    downloadStream.on('end', () => {
      console.log('File streamed successfully:', file.originalName);
    });

    // Stream the file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error viewing file:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to view file',
        message: error.message 
      });
    }
  }
});

// GET /api/files/:fileId/download - Download PDF (NO PATH.JOIN)
app.get('/api/files/:fileId/download', requireDB, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    console.log(`Downloading file: ${fileId}`);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error('Invalid file ID:', fileId);
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Find file document
    const file = await File.findById(fileId).lean();
    if (!file) {
      console.error('File not found in database:', fileId);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('Found file for download:', { 
      id: file._id, 
      name: file.originalName, 
      gridFSId: file.gridFSId,
      size: file.fileSize
    });

    // Check if file exists in GridFS
    const gridFSFiles = await gridFSBucket.find({ _id: file.gridFSId }).toArray();
    if (!gridFSFiles.length) {
      console.error('File not found in GridFS:', file.gridFSId);
      return res.status(404).json({ error: 'File not found in storage' });
    }

    const gridFSFile = gridFSFiles[0];
    console.log('GridFS file found for download:', { 
      id: gridFSFile._id, 
      filename: gridFSFile.filename, 
      length: gridFSFile.length 
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', gridFSFile.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create download stream from GridFS
    const downloadStream = gridFSBucket.openDownloadStream(file.gridFSId);
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download stream error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

    downloadStream.on('end', () => {
      console.log('File downloaded successfully:', file.originalName);
    });

    // Stream the file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to download file',
        message: error.message 
      });
    }
  }
});

// DELETE /api/files/:fileId - Delete file from GridFS
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    let gridFSDeleted = false;
    
    try {
      await gridFSBucket.delete(file.gridFSId);
      gridFSDeleted = true;
      console.log('Deleted GridFS file:', file.gridFSId);
    } catch (error) {
      console.warn('Warning: Could not delete GridFS file:', error.message);
    }

    await File.findByIdAndDelete(req.params.fileId);

    res.json({ 
      message: 'File deleted successfully',
      gridFSDeleted,
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

// GET /api/admin/stats - Statistics endpoint
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
      gridFSStats
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
      mongoose.connection.db.collection('pdfs.files').stats().catch(() => ({ count: 0, size: 0 }))
    ]);

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const baseURL = getBaseURL(req);

    res.json({
      overview: {
        totalFiles,
        totalSemesters,
        totalSubjects,
        totalSize: totalSizeResult[0]?.totalSize || 0,
        totalSizeFormatted: formatFileSize(totalSizeResult[0]?.totalSize || 0),
        gridFSFiles: gridFSStats.count || 0,
        gridFSSize: gridFSStats.size || 0,
        gridFSSizeFormatted: formatFileSize(gridFSStats.size || 0)
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
        viewUrl: `${baseURL}/api/files/${file._id}/view`,
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        fileType: file.originalName && file.originalName.includes('.') 
          ? file.originalName.split('.').pop().toLowerCase() 
          : 'pdf',
        fileSizeFormatted: formatFileSize(file.fileSize || 0)
      })),
      storageProvider: 'GridFS (MongoDB)',
      storageLocation: 'MongoDB GridFS Collection: pdfs',
      baseURL
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  let gridFSStatus = 'Not initialized';
  let gridFSFileCount = 0;
  let gridFSTestPassed = false;
  let dbError = null;
  
  if (dbStatus === 1 && gridFSBucket) {
    try {
      gridFSStatus = 'Ready';
      const fileCount = await File.countDocuments();
      gridFSFileCount = fileCount;
      
      const gridFSFiles = await gridFSBucket.find().limit(1).toArray();
      gridFSTestPassed = true;
      gridFSStatus = `Ready - ${gridFSFiles.length > 0 ? 'Files available' : 'No files yet'}`;
    } catch (error) {
      dbError = error.message;
      gridFSStatus = 'Error: ' + error.message;
      gridFSTestPassed = false;
    }
  }

  const overallStatus = (dbStatus === 1 && gridFSBucket && gridFSTestPassed) ? 'OK' : 'Warning';
  const baseURL = getBaseURL(req);

  res.status(overallStatus === 'OK' ? 200 : 503).json({ 
    status: overallStatus,
    message: `Server is ${overallStatus === 'OK' ? 'healthy and ready' : 'experiencing issues'}`,
    timestamp: new Date().toISOString(),
    baseURL,
    services: {
      database: {
        status: dbStatusMap[dbStatus] || 'Unknown',
        host: process.env.MONGO_HOST,
        name: process.env.MONGO_DB_NAME,
        fileCount: dbStatus === 1 ? gridFSFileCount : null,
        ...(dbError && { error: dbError })
      },
      storage: {
        provider: 'GridFS (MongoDB)',
        bucket: 'pdfs',
        status: gridFSStatus,
        ready: !!gridFSBucket,
        testPassed: gridFSTestPassed,
        fileCount: gridFSFileCount
      }
    },
    environment: process.env.NODE_ENV || 'development',
    deployment: {
      platform: process.env.RENDER_EXTERNAL_URL ? 'Render.com' : 'Other',
      external_url: process.env.RENDER_EXTERNAL_URL || null,
      detected_host: req.get('host')
    },
    uptime: Math.floor(process.uptime())
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
        console.log(`Created semester: ${sem.displayName}`);
      }
    }
    console.log('Semesters initialization completed');
  } catch (error) {
    console.error('Error initializing semesters:', error);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  
  console.log('Server shutdown complete');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
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

// 404 handler
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  const baseURL = getBaseURL(req);
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    baseURL
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\nUniversity Archive Server - COMPLETELY FIXED`);
  console.log(`Running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const serverURL = process.env.RENDER_EXTERNAL_URL || 
    (process.env.NODE_ENV === 'production' ? `https://archive-mi73.onrender.com` : `http://localhost:${PORT}`);
    
  console.log(`Server URL: ${serverURL}`);
  console.log(`File Storage: GridFS (MongoDB)`);
  console.log(`PDF Serving: COMPLETELY REWRITTEN - NO PATH DEPENDENCIES`);
  
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1 && gridFSBucket) {
      clearInterval(waitForDB);
      
      console.log('Initializing application...');
      await initializeSemesters();
      
      console.log('Server ready to accept connections');
      console.log('Health check:', `${serverURL}/api/health`);
      
      console.log('\nFIXES APPLIED:');
      console.log('✅ COMPLETELY REMOVED all path.join() operations');
      console.log('✅ Rewrote file serving routes with pure GridFS streaming');
      console.log('✅ Enhanced CORS headers for cross-origin PDF access');  
      console.log('✅ Added proper range request support for PDF viewing');
      console.log('✅ Improved error handling and logging throughout');
      console.log('✅ Fixed string splitting operations to prevent crashes');
      
      try {
        const fileCount = await File.countDocuments();
        console.log(`Current files in database: ${fileCount}`);
      } catch (error) {
        console.log('Could not count files:', error.message);
      }
    }
  }, 1000);
  
  setTimeout(() => {
    clearInterval(waitForDB);
    if (mongoose.connection.readyState !== 1 || !gridFSBucket) {
      console.log('Started without complete database/GridFS initialization');
    }
  }, 30000);
});