const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
require('dotenv').config();

console.log('🚀 STARTING UNIVERSITY ARCHIVE SERVER - RENDER OPTIMIZED');
console.log('📁 Using Local File Storage with Render Compatibility');

const app = express();

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Enhanced uploads directory initialization for Render
let UPLOADS_DIR = process.env.UPLOADS_DIR || path.join('/tmp', 'uploads');

// Use /tmp for Render since it's the only persistent writable directory
if (process.env.RENDER) {
  UPLOADS_DIR = path.join('/tmp', 'uploads');
  console.log('📦 Detected Render environment, using /tmp/uploads');
} else if (process.env.NODE_ENV === 'production') {
  // Try /tmp first for other cloud platforms
  UPLOADS_DIR = path.join('/tmp', 'uploads');
} else {
  // Local development
  UPLOADS_DIR = path.join(__dirname, 'uploads');
}

const initializeUploadsDir = async () => {
  try {
    // Create uploads directory with proper permissions
    await fs.mkdir(UPLOADS_DIR, { recursive: true, mode: 0o755 });
    
    // Test write permissions
    const testFile = path.join(UPLOADS_DIR, 'test-write.txt');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    console.log('📁 Uploads directory ready:', UPLOADS_DIR);
    console.log('✅ Write permissions confirmed');
    
    // Log directory contents for debugging
    try {
      const files = await fs.readdir(UPLOADS_DIR);
      console.log(`📊 Directory contains ${files.length} files`);
    } catch (readError) {
      console.log('📊 Directory is empty or unreadable');
    }
    
  } catch (error) {
    console.error('❌ Error initializing uploads directory:', error);
    console.error('📁 Attempted path:', UPLOADS_DIR);
    
    // Try alternative locations for different platforms
    const alternatives = [
      '/tmp/uploads',
      path.join('/tmp', 'university-archive'),
      path.join(process.cwd(), 'tmp', 'uploads'),
      path.join(process.env.HOME || '/tmp', 'uploads')
    ];
    
    for (const alt of alternatives) {
      try {
        await fs.mkdir(alt, { recursive: true, mode: 0o755 });
        console.log(`✅ Alternative uploads directory created: ${alt}`);
        UPLOADS_DIR = alt;
        process.env.UPLOADS_DIR = alt;
        break;
      } catch (altError) {
        console.log(`❌ Alternative ${alt} failed: ${altError.message}`);
      }
    }
  }
};

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'https://www.larchive.tech',
      'https://larchive.tech',
      'https://larchive.netlify.app',
      'https://larchive.vercel.app',
      /\.vercel\.app$/,
      /\.netlify\.app$/,
      /\.herokuapp\.com$/,
      /\.render\.com$/,
      /\.onrender\.com$/,
      /localhost:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    console.log(`🌐 CORS Check - Origin: ${origin}, Allowed: ${isAllowed}`);
    return callback(null, true); // Allow all origins for flexibility
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Range', 
    'Accept',
    'Origin',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: [
    'Content-Disposition', 
    'Content-Length', 
    'Content-Range', 
    'Accept-Ranges',
    'Content-Type',
    'X-Total-Count'
  ],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'self'", "blob:", "data:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many upload attempts, please try again later.' },
});

app.use('/api', generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base URL detection with Render support
const getBaseURL = (req) => {
  // Check for Render external URL first
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  // Check for other platform-specific URLs
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }
  
  const forwardedProto = req.get('x-forwarded-proto') || req.get('x-scheme');
  const forwardedHost = req.get('x-forwarded-host') || req.get('x-forwarded-server');
  const host = req.get('host');
  
  if (host) {
    // Platform detection
    if (host.includes('.onrender.com')) {
      return `https://${host}`;
    }
    if (host.includes('.render.com')) {
      return `https://${host}`;
    }
    if (host.includes('.vercel.app')) {
      return `https://${host}`;
    }
    if (host.includes('.netlify.app')) {
      return `https://${host}`;
    }
    if (host.includes('.herokuapp.com')) {
      return `https://${host}`;
    }
    if (host.includes('.railway.app')) {
      return `https://${host}`;
    }
    
    if (forwardedHost && forwardedProto) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    
    if (process.env.NODE_ENV === 'production') {
      const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https');
      return `${protocol}://${host}`;
    }
  }
  
  return `http://localhost:${process.env.PORT || 5000}`;
};

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000
};

console.log('🔌 Attempting MongoDB connection...');

let isConnecting = false;
let reconnectTimeout;
let retryCount = 0;
const maxRetries = 10;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log('✅ MongoDB connected successfully');
    retryCount = 0;
    isConnecting = false;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnecting = false;
    retryCount++;
    
    if (retryCount <= maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${delay/1000}s...`);
      reconnectTimeout = setTimeout(connectDB, delay);
    } else {
      console.error('💥 Max retry attempts reached');
    }
  }
};

connectDB();

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected');
  if (!isConnecting && !reconnectTimeout && retryCount < maxRetries) {
    console.log('🔄 Attempting reconnection...');
    reconnectTimeout = setTimeout(connectDB, 5000);
  }
});

// Models
let Semester, Type, Subject, Year, File;

try {
  // Define schemas inline since external model files might not be available
  const semesterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    order: { type: Number, required: true }
  });

  const typeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true }
  });

  const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true }
  });

  const yearSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
  });

  // File model schema for local storage
  const fileSchema = new mongoose.Schema({
    originalName: { type: String, required: true, index: true },
    fileName: { type: String, required: true }, // Actual file name on disk
    fileSize: { type: Number, required: true, min: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true, index: true },
    storageProvider: { type: String, default: 'local' },
    uploadedAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
  });

  fileSchema.index({ semester: 1, type: 1, subject: 1, year: 1 });
  fileSchema.index({ uploadedAt: -1 });

  // Create models
  Semester = mongoose.model('Semester', semesterSchema);
  Type = mongoose.model('Type', typeSchema);
  Subject = mongoose.model('Subject', subjectSchema);
  Year = mongoose.model('Year', yearSchema);
  File = mongoose.model('File', fileSchema);

  console.log('📋 Models created successfully');
} catch (error) {
  console.error('❌ Error creating models:', error.message);
  process.exit(1);
}

// Local file storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `file-${uniqueSuffix}${ext}`;
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('📄 File upload filter:', {
    originalName: file.originalname,
    mimeType: file.mimetype,
    fieldname: file.fieldname
  });
  
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
    fields: 10
  }
});

// Database connection middleware
const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ Database not ready for request:', req.originalUrl);
    return res.status(503).json({ 
      error: 'Service temporairement indisponible',
      message: 'Base de données en cours de connexion, veuillez réessayer',
      status: 'connecting'
    });
  }
  next();
};

// Enhanced file serving middleware for better compatibility
app.use('/api/files/:fileId/:action(view|download)', (req, res, next) => {
  const origin = req.get('origin');
  
  console.log('🌐 File request:', {
    method: req.method,
    fileId: req.params.fileId,
    action: req.params.action,
    origin: origin || 'direct',
    userAgent: (req.get('user-agent') || '').substring(0, 50),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Set comprehensive CORS headers
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, Content-Disposition, X-Content-Type-Options');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  next();
});

app.options('/api/files/:fileId/:action(view|download)', (req, res) => {
  console.log('✋ CORS preflight:', req.params.action, req.params.fileId);
  res.status(204).end();
});

// API ROUTES

// GET /api/semesters
app.get('/api/semesters', requireDB, async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ order: 1 }).lean();
    res.json(semesters);
  } catch (error) {
    console.error('❌ Error fetching semesters:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des semestres' });
  }
});

// GET /api/semesters/:semesterId/types
app.get('/api/semesters/:semesterId/types', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.semesterId)) {
      return res.status(400).json({ error: 'ID de semestre invalide' });
    }

    const types = await Type.find({ semester: req.params.semesterId })
      .populate('semester')
      .lean();
    res.json(types);
  } catch (error) {
    console.error('❌ Error fetching types:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des types' });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects
app.get('/api/semesters/:semesterId/types/:typeId/subjects', requireDB, async (req, res) => {
  try {
    const { semesterId, typeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(semesterId) || 
        !mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({ error: 'IDs invalides' });
    }

    const subjects = await Subject.find({
      semester: semesterId,
      type: typeId
    }).populate(['semester', 'type']).lean();
    
    res.json(subjects);
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matières' });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years
app.get('/api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years', requireDB, async (req, res) => {
  try {
    const { semesterId, typeId, subjectId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(semesterId) || 
        !mongoose.Types.ObjectId.isValid(typeId) ||
        !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ error: 'IDs invalides' });
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
    console.error('❌ Error fetching years:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des années' });
  }
});

// GET /api/years/:yearId/files
app.get('/api/years/:yearId/files', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.yearId)) {
      return res.status(400).json({ error: 'ID d\'année invalide' });
    }

    console.log(`📁 Fetching files for year: ${req.params.yearId}`);

    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();

    console.log(`📄 Found ${files.length} files for year ${req.params.yearId}`);

    const baseURL = getBaseURL(req);

    const enhancedFiles = files.map(file => ({
      ...file,
      viewUrl: `${baseURL}/api/files/${file._id}/view`,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      storageProvider: 'local',
      fileType: getFileExtension(file.originalName)
    }));
      
    res.json(enhancedFiles);
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
  }
});

// GET /api/files - Paginated file list
app.get('/api/files', requireDB, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    
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
      storageProvider: 'local',
      fileType: getFileExtension(file.originalName)
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
    console.error('❌ Error fetching paginated files:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
  }
});

function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return 'pdf';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'pdf';
}

// GET /api/files/:fileId/view - Stream PDF for inline viewing with enhanced error handling
app.get('/api/files/:fileId/view', requireDB, async (req, res) => {
  const fileId = req.params.fileId;
  
  try {
    console.log(`👁️ VIEW REQUEST: ${fileId} from ${req.ip}`);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error('❌ Invalid file ID:', fileId);
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    const file = await File.findById(fileId).lean();
    if (!file) {
      console.error('❌ File not found in database:', fileId);
      return res.status(404).json({ error: 'Fichier introuvable' });
    }

    console.log('📄 File found:', {
      id: file._id,
      name: file.originalName,
      size: file.fileSize,
      fileName: file.fileName,
      storageProvider: file.storageProvider
    });

    if (!file.fileName) {
      console.log('⚠️ File missing fileName field');
      return res.status(404).json({ 
        error: 'Fichier corrompu',
        message: 'Informations de fichier manquantes',
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

    // Construct file path with absolute resolution
    const filePath = path.resolve(UPLOADS_DIR, file.fileName);
    
    try {
      // Check if file exists with detailed error reporting
      const stats = await fs.stat(filePath);
      console.log('📄 Local file exists, serving:', filePath, 'Size:', stats.size);
      
      // Additional security check - ensure file is within uploads directory
      const resolvedUploadsDir = path.resolve(UPLOADS_DIR);
      if (!filePath.startsWith(resolvedUploadsDir)) {
        console.error('❌ Security: File path outside uploads directory:', filePath);
        return res.status(403).json({ error: 'Accès interdit' });
      }
      
      // Validate file size matches database
      if (stats.size !== file.fileSize) {
        console.warn('⚠️ File size mismatch - DB:', file.fileSize, 'Disk:', stats.size);
      }
      
      // Set proper headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-File-Name', encodeURIComponent(file.originalName));
      
      // Handle range requests for better PDF streaming
      const range = req.headers.range;
      if (range) {
        console.log('📄 Handling range request:', range);
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        if (start >= stats.size || end >= stats.size || start > end) {
          res.status(416);
          res.setHeader('Content-Range', `bytes */${stats.size}`);
          return res.end();
        }
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Content-Length', chunksize);
        
        const stream = fsSync.createReadStream(filePath, { start, end });
        
        stream.on('error', (streamError) => {
          console.error('❌ Stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur lors du streaming' });
          }
        });
        
        stream.pipe(res);
      } else {
        // Send entire file
        const readStream = fsSync.createReadStream(filePath);
        
        readStream.on('error', (streamError) => {
          console.error('❌ Read stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
          }
        });
        
        readStream.on('open', () => {
          console.log('📄 Starting file stream for:', file.originalName);
        });
        
        readStream.pipe(res);
      }
      
          } catch (fileError) {
      console.error('❌ Local file missing from disk:', filePath, fileError);
      console.error('📁 Current UPLOADS_DIR:', UPLOADS_DIR);
      console.error('📁 Resolved path:', path.resolve(UPLOADS_DIR));
      
      // Try to list directory contents for debugging
      try {
        const dirContents = await fs.readdir(UPLOADS_DIR);
        console.error('📁 Directory contents:', dirContents.slice(0, 10));
      } catch (dirError) {
        console.error('📁 Cannot read directory:', dirError.message);
      }
      
      return res.status(404).json({ 
        error: 'Fichier manquant sur le disque',
        message: `Le fichier ${file.originalName} n'existe plus sur le serveur`,
        suggestion: 'Veuillez re-uploader ce fichier',
        debug: process.env.NODE_ENV === 'development' ? {
          expectedPath: filePath,
          uploadsDir: UPLOADS_DIR,
          error: fileError.message
        } : undefined
      });
    }

  } catch (error) {
    console.error('❌ View error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la visualisation',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET /api/files/:fileId/download - Force download with enhanced error handling
app.get('/api/files/:fileId/download', requireDB, async (req, res) => {
  const fileId = req.params.fileId;
  
  try {
    console.log(`⬇️ DOWNLOAD REQUEST: ${fileId} from ${req.ip}`);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error('❌ Invalid file ID:', fileId);
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    const file = await File.findById(fileId).lean();
    if (!file) {
      console.error('❌ File not found in database:', fileId);
      return res.status(404).json({ error: 'Fichier introuvable' });
    }

    console.log('📄 Download file found:', {
      id: file._id,
      name: file.originalName,
      size: file.fileSize,
      fileName: file.fileName,
      storageProvider: file.storageProvider
    });

    if (!file.fileName) {
      console.log('⚠️ File missing fileName field');
      return res.status(404).json({ 
        error: 'Fichier corrompu',
        message: 'Informations de fichier manquantes'
      });
    }

    // Construct file path with absolute resolution
    const filePath = path.resolve(UPLOADS_DIR, file.fileName);
    
    try {
      const stats = await fs.stat(filePath);
      console.log('📄 Local file exists, forcing download:', filePath, 'Size:', stats.size);
      
      // Security check
      const resolvedUploadsDir = path.resolve(UPLOADS_DIR);
      if (!filePath.startsWith(resolvedUploadsDir)) {
        console.error('❌ Security: File path outside uploads directory:', filePath);
        return res.status(403).json({ error: 'Accès interdit' });
      }
      
      // Set download headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-File-Name', encodeURIComponent(file.originalName));
      
      const readStream = fsSync.createReadStream(filePath);
      
      readStream.on('error', (streamError) => {
        console.error('❌ Download stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur lors du téléchargement' });
        }
      });
      
      readStream.on('open', () => {
        console.log('📄 Starting download stream for:', file.originalName);
      });
      
      readStream.pipe(res);
      
    } catch (fileError) {
      console.error('❌ Local file missing from disk:', filePath, fileError.message);
      return res.status(404).json({ 
        error: 'Fichier manquant sur le disque',
        message: `Le fichier ${file.originalName} n'existe plus sur le serveur`,
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// POST /api/upload - Upload files locally with enhanced error handling
app.post('/api/upload', uploadLimiter, requireDB, (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux (max 50MB)' });
      }
      return res.status(400).json({ error: 'Erreur d\'upload: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
    }

    console.log('📤 File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      destination: req.file.destination
    });

    // Validate file was actually written to disk
    try {
      const filePath = path.resolve(req.file.path);
      const stats = await fs.stat(filePath);
      console.log('✅ File confirmed on disk:', filePath, 'Size:', stats.size);
      
      if (stats.size !== req.file.size) {
        console.error('❌ File size mismatch - upload corrupted');
        await fs.unlink(filePath).catch(console.error);
        return res.status(400).json({ error: 'Upload corrompu, veuillez réessayer' });
      }
    } catch (fsError) {
      console.error('❌ File not found on disk after upload:', fsError);
      return res.status(500).json({ error: 'Erreur de stockage, veuillez réessayer' });
    }

    const { semester, type, subject, year } = req.body || {};
    if (!semester || !type || !subject || !year) {
      // Clean up uploaded file if validation fails
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError);
      }
      
      return res.status(400).json({
        error: 'Champs requis manquants',
        required: ['semester', 'type', 'subject', 'year']
      });
    }

    const session = await mongoose.startSession();
    
    try {
      console.log('📤 Starting database transaction for:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        metadata: { semester, type, subject, year }
      });

      let savedFile;

      await session.withTransaction(async () => {
        // Create or find database entities
        let semesterDoc = await Semester.findOne({ name: semester }).session(session);
        if (!semesterDoc) {
          throw new Error('Semestre invalide');
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
          console.log('➕ Created new type:', type);
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
          console.log('➕ Created new subject:', subject);
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
          console.log('➕ Created new year:', year);
        }

        // Create file document
        const fileDoc = new File({
          originalName: req.file.originalname,
          fileName: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'local',
          uploadedAt: new Date()
        });

        savedFile = await fileDoc.save({ session });
        await savedFile.populate(['semester', 'type', 'subject', 'year']);

        console.log('✅ File saved to database:', savedFile._id);
        
        // Final verification that file still exists
        const finalPath = path.resolve(UPLOADS_DIR, req.file.filename);
        try {
          await fs.access(finalPath);
          console.log('✅ Final verification passed:', finalPath);
        } catch (verifyError) {
          console.error('❌ Final verification failed:', verifyError);
          throw new Error('Fichier non accessible après sauvegarde');
        }
      });

      const baseUrl = getBaseURL(req);
      
      const responseFile = {
        ...savedFile.toObject(),
        viewUrl: `${baseUrl}/api/files/${savedFile._id}/view`,
        downloadUrl: `${baseUrl}/api/files/${savedFile._id}/download`,
        fileType: getFileExtension(req.file.originalname)
      };

      console.log('✅ Upload successful:', {
        fileId: savedFile._id,
        originalname: req.file.originalname,
        filename: req.file.filename,
        storagePath: path.resolve(UPLOADS_DIR, req.file.filename),
        viewUrl: responseFile.viewUrl,
        downloadUrl: responseFile.downloadUrl
      });

      res.status(201).json({ 
        message: 'Fichier uploadé avec succès',
        file: responseFile
      });
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Cleanup uploaded file on error
      try {
        const cleanupPath = path.resolve(req.file.path);
        await fs.unlink(cleanupPath);
        console.log('🗑️ Cleaned up uploaded file:', cleanupPath);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError);
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de l\'upload',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
      });
    } finally {
      await session.endSession();
    }
  });
});

// PUT /api/files/:fileId - Update file metadata
app.put('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { originalName, semester, type, subject, year } = req.body;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    console.log(`💾 Updating file ${fileId}:`, { originalName, semester, type, subject, year });

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const file = await File.findById(fileId).session(session);
      if (!file) {
        throw new Error('Fichier introuvable');
      }

      let semesterDoc = await Semester.findOne({ name: semester }).session(session);
      if (!semesterDoc) {
        throw new Error('Semestre invalide');
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

      console.log('✅ File updated:', updatedFile.originalName);
      
      res.json({
        message: 'Fichier mis à jour avec succès',
        file: updatedFile
      });
    });

    await session.endSession();
  } catch (error) {
    console.error('❌ File update failed:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

// DELETE /api/files/:fileId - Delete file from both disk and database
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }

    console.log('🗑️ Deleting file:', { id: file._id, name: file.originalName, fileName: file.fileName });

    let diskDeleted = false;
    
    // Delete from disk
    if (file.fileName) {
      try {
        const filePath = path.resolve(UPLOADS_DIR, file.fileName);
        await fs.unlink(filePath);
        diskDeleted = true;
        console.log('✅ File deleted from disk:', filePath);
      } catch (error) {
        console.warn('⚠️ Disk deletion failed:', error.message);
      }
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ 
      message: 'Fichier supprimé avec succès',
      diskDeleted,
      databaseDeleted: true
    });
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// GET /api/admin/files - Admin file list
app.get('/api/admin/files', requireDB, async (req, res) => {
  try {
    console.log('👨‍💼 Admin: Fetching all files');
    
    const files = await File.find()
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();

    console.log(`📊 Admin: Found ${files.length} files`);

    const baseURL = getBaseURL(req);

    const enhancedFiles = files.map(file => ({
      ...file,
      viewUrl: `${baseURL}/api/files/${file._id}/view`,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      storageProvider: 'local',
      fileType: getFileExtension(file.originalName)
    }));

    res.json(enhancedFiles);
  } catch (error) {
    console.error('❌ Admin files fetch failed:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers admin' });
  }
});

// GET /api/admin/stats - Admin statistics
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
        .lean()
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
        viewUrl: `${baseURL}/api/files/${file._id}/view`,
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        fileType: getFileExtension(file.originalName),
        fileSizeFormatted: formatFileSize(file.fileSize || 0)
      })),
      storageProvider: 'Local File System',
      storageLocation: UPLOADS_DIR,
      baseURL
    });
  } catch (error) {
    console.error('❌ Stats fetch failed:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/debug/files/:fileId - Debug endpoint with enhanced diagnostics
app.get('/api/debug/files/:fileId', requireDB, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.json({ error: 'File not found in DB' });
    
    const filePath = path.resolve(UPLOADS_DIR, file.fileName);
    
    let filesystemData = {
      path: filePath,
      uploadsDir: UPLOADS_DIR,
      absoluteUploadsDir: path.resolve(UPLOADS_DIR),
      exists: false
    };

    try {
      const stats = await fs.stat(filePath);
      filesystemData = {
        ...filesystemData,
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        permissions: stats.mode.toString(8)
      };
    } catch (fileError) {
      filesystemData.error = fileError.message;
      filesystemData.code = fileError.code;
    }

    // Check directory contents
    let directoryInfo = {};
    try {
      const dirStats = await fs.stat(UPLOADS_DIR);
      const dirContents = await fs.readdir(UPLOADS_DIR);
      directoryInfo = {
        exists: true,
        isDirectory: dirStats.isDirectory(),
        fileCount: dirContents.length,
        permissions: dirStats.mode.toString(8),
        sampleFiles: dirContents.slice(0, 10)
      };
    } catch (dirError) {
      directoryInfo = {
        exists: false,
        error: dirError.message,
        code: dirError.code
      };
    }

    res.json({
      database: {
        id: file._id,
        originalName: file.originalName,
        fileName: file.fileName,
        fileSize: file.fileSize,
        storageProvider: file.storageProvider,
        uploadedAt: file.uploadedAt
      },
      filesystem: filesystemData,
      directory: directoryInfo,
      urls: {
        view: `${getBaseURL(req)}/api/files/${file._id}/view`,
        download: `${getBaseURL(req)}/api/files/${file._id}/download`
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.env.RENDER ? 'Render' : 'Other',
        uploadsEnvVar: process.env.UPLOADS_DIR,
        cwd: process.cwd(),
        tmpDir: require('os').tmpdir()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/health - Enhanced health check with comprehensive diagnostics
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected', 
    2: 'Connecting',
    3: 'Disconnecting'
  };

  let storageStatus = 'Not tested';
  let storageTestPassed = false;
  let storageStats = null;
  let sampleFiles = [];
  
  // Test local storage with comprehensive checks
  try {
    // Check if directory exists
    await fs.access(UPLOADS_DIR);
    const stats = await fs.stat(UPLOADS_DIR);
    
    // Test write permissions
    const testFile = path.join(UPLOADS_DIR, `health-test-${Date.now()}.txt`);
    await fs.writeFile(testFile, 'health check test');
    
    // Test read permissions
    const testContent = await fs.readFile(testFile, 'utf8');
    
    // Cleanup test file
    await fs.unlink(testFile);
    
    // Get directory contents
    const files = await fs.readdir(UPLOADS_DIR);
    
    storageTestPassed = true;
    storageStatus = 'Ready - Directory exists, readable and writable';
    storageStats = {
      path: UPLOADS_DIR,
      absolutePath: path.resolve(UPLOADS_DIR),
      isDirectory: stats.isDirectory(),
      fileCount: files.length,
      permissions: stats.mode.toString(8),
      created: stats.birthtime,
      modified: stats.mtime,
      sampleFiles: files.slice(0, 5),
      testWriteSuccess: testContent === 'health check test'
    };
  } catch (error) {
    storageStatus = 'Error: ' + error.message;
    storageTestPassed = false;
    storageStats = {
      path: UPLOADS_DIR,
      absolutePath: path.resolve(UPLOADS_DIR),
      error: error.code || 'UNKNOWN',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
  
  // Test database connection and get sample data
  let dbInfo = { status: dbStatusMap[dbStatus] || 'Unknown' };
  if (dbStatus === 1) {
    try {
      const [fileCount, semesterCount] = await Promise.all([
        File.countDocuments(),
        Semester.countDocuments()
      ]);
      
      dbInfo.fileCount = fileCount;
      dbInfo.semesterCount = semesterCount;
      
      if (fileCount > 0) {
        sampleFiles = await File.find()
          .limit(3)
          .select('_id originalName fileName fileSize uploadedAt')
          .lean();
      }
        
    } catch (error) {
      dbInfo.error = error.message;
    }
  }

  const overallStatus = (dbStatus === 1 && storageTestPassed) ? 'OK' : 'Warning';
  const baseURL = getBaseURL(req);

  res.status(overallStatus === 'OK' ? 200 : 503).json({ 
    status: overallStatus,
    message: `Serveur ${overallStatus === 'OK' ? 'opérationnel' : 'en difficulté'}`,
    timestamp: new Date().toISOString(),
    baseURL,
    services: {
      database: dbInfo,
      storage: {
        provider: 'Local File System',
        status: storageStatus,
        ready: storageTestPassed,
        stats: storageStats
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.env.RENDER ? 'Render' : 
                process.env.VERCEL ? 'Vercel' :
                process.env.HEROKU_APP_NAME ? 'Heroku' : 'Other',
      external_url: process.env.RENDER_EXTERNAL_URL || null,
      detected_host: req.get('host'),
      working_directory: process.cwd(),
      uploads_dir_env: process.env.UPLOADS_DIR,
      tmp_dir: require('os').tmpdir()
    },
    testing: {
      sampleFiles: sampleFiles.map(file => ({
        id: file._id,
        name: file.originalName,
        fileName: file.fileName,
        size: file.fileSize,
        uploadedAt: file.uploadedAt,
        viewUrl: `${baseURL}/api/files/${file._id}/view`,
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        expectedDiskPath: file.fileName ? path.resolve(UPLOADS_DIR, file.fileName) : null
      }))
    },
    uptime: Math.floor(process.uptime()),
    version: '2.4.0-render-optimized'
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
        console.log(`➕ Created semester: ${sem.displayName}`);
      }
    }
    console.log('📚 Semesters initialization completed');
  } catch (error) {
    console.error('❌ Semester initialization failed:', error);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  try{
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  console.log('👋 Server shutdown complete');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Error handling middleware  
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erreur interne du serveur' 
    : error.message;
    
  res.status(error.status || 500).json({ 
    error: 'Erreur interne du serveur',
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`📍 Route not found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  const baseURL = getBaseURL(req);
  
  res.status(404).json({ 
    error: 'Route introuvable',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    baseURL,
    availableRoutes: {
      health: '/api/health',
      files: '/api/files',
      semesters: '/api/semesters',
      upload: '/api/upload',
      debug: '/api/debug/files/:fileId'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Initialize uploads directory before starting server
(async () => {
  await initializeUploadsDir();

  app.listen(PORT, async () => {
    console.log(`\n🎓 UNIVERSITY ARCHIVE SERVER - RENDER OPTIMIZED`);
    console.log(`🚀 Running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Platform: ${process.env.RENDER ? 'Render.com' : 'Other'}`);
    
    const serverURL = process.env.RENDER_EXTERNAL_URL || 
      (process.env.NODE_ENV === 'production' ? `https://your-app.onrender.com` : `http://localhost:${PORT}`);
      
    console.log(`🔗 Server URL: ${serverURL}`);
    console.log(`📁 Storage: Local File System (${UPLOADS_DIR})`);
    console.log(`📦 Upload Directory: ${UPLOADS_DIR}`);
    console.log(`📄 PDF Serving: Direct streaming with enhanced error handling`);
    console.log(`🌐 CORS: Cross-origin enabled for all domains`);
    console.log(`🔧 Version: 2.4.0-render-optimized`);
    
    // Test storage immediately
    try {
      const testPath = path.join(UPLOADS_DIR, 'startup-test.txt');
      await fs.writeFile(testPath, 'startup test');
      await fs.unlink(testPath);
      console.log('✅ Storage test passed at startup');
    } catch (storageError) {
      console.error('❌ Storage test failed at startup:', storageError.message);
    }
    
    const waitForDB = setInterval(async () => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(waitForDB);
        
        console.log('🔧 Initializing application...');
        await initializeSemesters();
        
        // Check existing files
        try {
          const fileCount = await File.countDocuments();
          console.log(`📊 Database contains ${fileCount} files`);
          
          if (fileCount > 0) {
            // Check file consistency
            const sampleFile = await File.findOne({ fileName: { $exists: true, $ne: null } }).lean();
            if (sampleFile) {
              console.log('📝 Sample file URLs:');
              console.log(`   View: ${serverURL}/api/files/${sampleFile._id}/view`);
              console.log(`   Download: ${serverURL}/api/files/${sampleFile._id}/download`);
              console.log(`   Debug: ${serverURL}/api/debug/files/${sampleFile._id}`);
              
              // Test if file exists on disk
              if (sampleFile.fileName) {
                try {
                  await fs.access(path.resolve(UPLOADS_DIR, sampleFile.fileName));
                  console.log('✅ Sample file exists on disk');
                } catch (fileError) {
                  console.warn('⚠️ Sample file missing from disk - uploads may be lost on container restart');
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not query files:', error.message);
        }
        
        console.log('\n📋 AVAILABLE ENDPOINTS:');
        console.log(`   Health Check: GET ${serverURL}/api/health`);
        console.log(`   Upload File: POST ${serverURL}/api/upload`);
        console.log(`   View PDF: GET ${serverURL}/api/files/:fileId/view`);
        console.log(`   Download PDF: GET ${serverURL}/api/files/:fileId/download`);
        console.log(`   List Files: GET ${serverURL}/api/files`);
        console.log(`   Get Semesters: GET ${serverURL}/api/semesters`);
        console.log(`   Admin Stats: GET ${serverURL}/api/admin/stats`);
        console.log(`   Debug File: GET ${serverURL}/api/debug/files/:fileId`);
        
        console.log('\n✅ KEY FEATURES:');
        console.log('  - PDF upload, view, and download');
        console.log('  - Local file storage in /tmp (Render compatible)');
        console.log('  - Enhanced CORS support');
        console.log('  - Range request support for PDF streaming');
        console.log('  - Comprehensive error handling');
        console.log('  - Database connection retry logic');
        console.log('  - Admin statistics and file management');
        console.log('  - Debug endpoints for troubleshooting');
        
        console.log('\n⚠️ IMPORTANT NOTES FOR RENDER:');
        console.log('  - Files are stored in /tmp and will be lost on container restart');
        console.log('  - Consider implementing persistent storage for production');
        console.log('  - Database connections are persistent and will auto-reconnect');
        console.log('  - All file operations include comprehensive error handling');
        
        console.log('\n🎉 University Archive Server is ready for requests!');
        console.log(`🩺 Health check: ${serverURL}/api/health`);
      }
    }, 1000);
    
    // Safety timeout for DB connection
    setTimeout(() => {
      clearInterval(waitForDB);
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ Started without complete DB initialization');
        console.log('💡 Server will continue attempting database reconnection');
        console.log('🌐 API endpoints are available but database-dependent features may fail');
      }
    }, 30000);
  });

  // Enhanced error handling for production stability
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    console.log('🔄 Server continuing to run...');
    // Don't exit - let the app continue running
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    console.log('🔄 Server continuing to run...');
    // Don't exit - let the app continue running
  });

  // Handle memory warnings
  process.on('warning', (warning) => {
    console.warn('⚠️ Node.js Warning:', warning.name, warning.message);
  });

})();

// Export app for testing purposes
module.exports = app;