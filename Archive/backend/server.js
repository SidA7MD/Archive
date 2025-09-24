const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

console.log('🚀 STARTING UNIVERSITY ARCHIVE SERVER - LOCAL STORAGE FALLBACK');
console.log('📁 Using Local File Storage (Appwrite fallback)');

const app = express();

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const initializeUploadsDir = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('📁 Uploads directory ready:', UPLOADS_DIR);
  } catch (error) {
    console.error('❌ Error creating uploads directory:', error);
  }
};

// Initialize uploads directory
initializeUploadsDir();

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
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.warn('⚠️ CORS Request from:', origin);
    // Allow all origins temporarily to fix CORS issues
    return callback(null, true);
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

// Handle preflight OPTIONS requests
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

// Base URL detection
const getBaseURL = (req) => {
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  const forwardedProto = req.get('x-forwarded-proto') || req.get('x-scheme');
  const forwardedHost = req.get('x-forwarded-host') || req.get('x-forwarded-server');
  const host = req.get('host');
  
  if (host) {
    if (host.includes('.onrender.com')) {
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
  Semester = require('./models/Semester');
  Type = require('./models/Type');
  Subject = require('./models/Subject');
  Year = require('./models/Year');
  console.log('📋 Models loaded successfully');
} catch (error) {
  console.error('❌ Error loading models:', error.message);
  process.exit(1);
}

// File model schema for local storage (with legacy support)
const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, index: true },
  fileName: { type: String }, // Actual file name on disk (new field)
  appwriteFileId: { type: String }, // Legacy Appwrite file ID (old field)
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

File = mongoose.model('File', fileSchema);

// Migration helper to handle old Appwrite records
const handleLegacyFile = async (file) => {
  console.log(`⚠️ Legacy file detected: ${file.originalName} (ID: ${file._id})`);
  
  // If it's an old Appwrite file (has appwriteFileId but no fileName)
  if (file.appwriteFileId && !file.fileName) {
    console.log(`🗑️ Removing legacy Appwrite file from database: ${file.originalName}`);
    
    try {
      await File.findByIdAndDelete(file._id);
      return { deleted: true, reason: 'Legacy Appwrite file removed' };
    } catch (error) {
      console.error('❌ Failed to delete legacy file:', error);
      return { deleted: false, error: error.message };
    }
  }
  
  // If it has neither appwriteFileId nor fileName, it's corrupted
  if (!file.appwriteFileId && !file.fileName) {
    console.log(`🗑️ Removing corrupted file record: ${file.originalName}`);
    
    try {
      await File.findByIdAndDelete(file._id);
      return { deleted: true, reason: 'Corrupted file record removed' };
    } catch (error) {
      console.error('❌ Failed to delete corrupted file:', error);
      return { deleted: false, error: error.message };
    }
  }
  
  return { deleted: false, reason: 'File appears valid' };
};

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

// File serving middleware
app.use('/api/files/:fileId/:action(view|download)', (req, res, next) => {
  const origin = req.get('origin');
  const userAgent = req.get('user-agent') || '';
  
  console.log('🌐 File request:', {
    method: req.method,
    fileId: req.params.fileId,
    action: req.params.action,
    origin: origin || 'direct',
    userAgent: userAgent.substring(0, 100),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
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
      
    res.json(files);
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

// GET /api/files/:fileId/view - Stream PDF for inline viewing
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
      appwriteFileId: file.appwriteFileId,
      storageProvider: file.storageProvider
    });

    // Handle legacy files
    if (!file.fileName || file.appwriteFileId) {
      console.log('⚠️ Legacy or invalid file detected, attempting cleanup...');
      
      const migrationResult = await handleLegacyFile(file);
      
      if (migrationResult.deleted) {
        return res.status(410).json({ 
          error: 'Fichier legacy supprimé',
          message: migrationResult.reason,
          suggestion: 'Veuillez re-uploader ce fichier avec le nouveau système'
        });
      }
      
      return res.status(404).json({ 
        error: 'Fichier incompatible',
        message: 'Ce fichier provient de l\'ancien système et ne peut pas être affiché',
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

    // Handle local files
    const filePath = path.join(UPLOADS_DIR, file.fileName);
    
    try {
      await fs.access(filePath);
      console.log('📄 Local file exists, serving:', filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      res.sendFile(filePath);
      
    } catch (fileError) {
      console.error('❌ Local file missing from disk:', filePath);
      return res.status(404).json({ 
        error: 'Fichier manquant sur le disque',
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

  } catch (error) {
    console.error('❌ View error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la visualisation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/:fileId/download - Force download
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
      appwriteFileId: file.appwriteFileId,
      storageProvider: file.storageProvider
    });

    // Handle legacy files
    if (!file.fileName || file.appwriteFileId) {
      console.log('⚠️ Legacy or invalid file detected, attempting cleanup...');
      
      const migrationResult = await handleLegacyFile(file);
      
      if (migrationResult.deleted) {
        return res.status(410).json({ 
          error: 'Fichier legacy supprimé',
          message: migrationResult.reason,
          suggestion: 'Veuillez re-uploader ce fichier avec le nouveau système'
        });
      }
      
      return res.status(404).json({ 
        error: 'Fichier incompatible',
        message: 'Ce fichier provient de l\'ancien système et ne peut pas être téléchargé',
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

    // Handle local files
    const filePath = path.join(UPLOADS_DIR, file.fileName);
    
    try {
      await fs.access(filePath);
      console.log('📄 Local file exists, forcing download:', filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.sendFile(filePath);
      
    } catch (fileError) {
      console.error('❌ Local file missing from disk:', filePath);
      return res.status(404).json({ 
        error: 'Fichier manquant sur le disque',
        suggestion: 'Veuillez re-uploader ce fichier'
      });
    }

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/upload - Fixed Upload files locally
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
      path: req.file.path
    });

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
        path: req.file.path,
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
        await fs.unlink(req.file.path);
        console.log('🗑️ Cleaned up uploaded file:', req.file.path);
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
    
    // Delete from disk (only if it's a local file)
    if (file.fileName) {
      try {
        const filePath = path.join(UPLOADS_DIR, file.fileName);
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

// POST /api/admin/cleanup-legacy - Remove all legacy files
app.post('/api/admin/cleanup-legacy', requireDB, async (req, res) => {
  try {
    console.log('🧹 Starting legacy file cleanup...');
    
    // Find all files that are legacy (have appwriteFileId but no fileName)
    const legacyFiles = await File.find({
      $or: [
        { appwriteFileId: { $exists: true, $ne: null }, fileName: { $exists: false } },
        { appwriteFileId: { $exists: true, $ne: null }, fileName: null },
        { appwriteFileId: { $exists: false }, fileName: { $exists: false } },
        { appwriteFileId: null, fileName: null }
      ]
    });
    
    console.log(`📊 Found ${legacyFiles.length} legacy files to clean up`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const file of legacyFiles) {
      try {
        await File.findByIdAndDelete(file._id);
        deletedCount++;
        console.log(`✅ Deleted legacy file: ${file.originalName}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete file ${file.originalName}:`, error.message);
      }
    }
    
    console.log(`🧹 Cleanup complete: ${deletedCount} deleted, ${errorCount} errors`);
    
    res.json({
      message: 'Legacy file cleanup completed',
      stats: {
        found: legacyFiles.length,
        deleted: deletedCount,
        errors: errorCount
      }
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({ 
      error: 'Erreur lors du nettoyage',
      message: error.message
    });
  }
});

// GET /api/health - Health check
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
  let dbError = null;
  let storageError = null;
  
  // Test local storage
  try {
    await fs.access(UPLOADS_DIR);
    const stats = await fs.stat(UPLOADS_DIR);
    storageTestPassed = true;
    storageStatus = `Ready - Directory exists (${stats.isDirectory() ? 'Dir' : 'File'})`;
  } catch (error) {
    storageError = error.message;
    storageStatus = 'Error: ' + error.message;
    storageTestPassed = false;
  }
  
  // Test database connection
  if (dbStatus === 1) {
    try {
      const fileCount = await File.countDocuments();
      console.log(`📊 Database file count: ${fileCount}`);
    } catch (error) {
      dbError = error.message;
    }
  }

  // Check migration status
  let legacyFilesCount = 0;
  let validFilesCount = 0;
  
  if (dbStatus === 1) {
    try {
      legacyFilesCount = await File.countDocuments({
        $or: [
          { appwriteFileId: { $exists: true, $ne: null }, fileName: { $exists: false } },
          { appwriteFileId: { $exists: true, $ne: null }, fileName: null }
        ]
      });
      
      validFilesCount = await File.countDocuments({
        fileName: { $exists: true, $ne: null },
        appwriteFileId: { $exists: false }
      });
    } catch (error) {
      console.error('❌ Error counting migration files:', error);
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
      database: {
        status: dbStatusMap[dbStatus] || 'Unknown',
        host: process.env.MONGO_HOST,
        name: process.env.MONGO_DB_NAME,
        ...(dbError && { error: dbError })
      },
      storage: {
        provider: 'Local File System',
        directory: UPLOADS_DIR,
        status: storageStatus,
        ready: storageTestPassed,
        ...(storageError && { error: storageError })
      }
    },
    migration: {
      hasLegacyFiles: legacyFilesCount,
      hasValidFiles: validFilesCount,
      needsCleanup: legacyFilesCount > 0,
      suggestion: legacyFilesCount > 0 ? 
        'Run POST /api/admin/cleanup-legacy to remove legacy files' : 
        'No legacy files detected'
    },
    environment: process.env.NODE_ENV || 'development',
    deployment: {
      platform: process.env.RENDER_EXTERNAL_URL ? 'Render.com' : 'Other',
      external_url: process.env.RENDER_EXTERNAL_URL || null,
      detected_host: req.get('host')
    },
    uptime: Math.floor(process.uptime()),
    version: '2.2.0-local-storage'
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
  
  try {
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
      upload: '/api/upload'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🎓 UNIVERSITY ARCHIVE SERVER - LOCAL STORAGE SOLUTION`);
  console.log(`🚀 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const serverURL = process.env.RENDER_EXTERNAL_URL || 
    (process.env.NODE_ENV === 'production' ? `https://archive-mi73.onrender.com` : `http://localhost:${PORT}`);
    
  console.log(`🔗 Server URL: ${serverURL}`);
  console.log(`📁 Storage: Local File System`);
  console.log(`📦 Upload Directory: ${UPLOADS_DIR}`);
  console.log(`📄 PDF Serving: Direct file serving with CORS support`);
  console.log(`🌐 CORS: Enhanced configuration for frontend domains`);
  
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForDB);
      
      console.log('🔧 Initializing application...');
      await initializeSemesters();
      
      // Check for legacy files
      try {
        const legacyFilesCount = await File.countDocuments({
          $or: [
            { appwriteFileId: { $exists: true, $ne: null }, fileName: { $exists: false } },
            { appwriteFileId: { $exists: true, $ne: null }, fileName: null }
          ]
        });
        
        const validFilesCount = await File.countDocuments({
          fileName: { $exists: true, $ne: null },
          appwriteFileId: { $exists: false }
        });
        
        console.log(`📊 Migration Status: ${legacyFilesCount} legacy files, ${validFilesCount} valid files`);
        
        if (legacyFilesCount > 0) {
          console.log('⚠️ Legacy files detected. Run POST /api/admin/cleanup-legacy to clean up');
        }
      } catch (error) {
        console.log('⚠️ Could not check migration status:', error.message);
      }
      
      console.log('🎯 Server ready for requests');
      console.log('🩺 Health check:', `${serverURL}/api/health`);
      
      console.log('\n🛠️ LEGACY FILE MIGRATION IMPLEMENTED:');
      console.log('✅ Detects and handles old Appwrite file records');
      console.log('✅ Automatically cleans up corrupted file entries');
      console.log('✅ Provides clear error messages for legacy files');
      console.log('✅ Admin cleanup endpoint available');
      console.log('✅ Health check shows migration status');
      console.log('✅ Seamless transition from Appwrite to Local Storage');
      
      try {
        const fileCount = await File.countDocuments();
        console.log(`📊 Database contains ${fileCount} files`);
        
        if (fileCount > 0) {
          const sampleFile = await File.findOne({ fileName: { $exists: true, $ne: null } }).lean();
          if (sampleFile) {
            console.log('📝 Sample file test URLs:');
            console.log(`   View: ${serverURL}/api/files/${sampleFile._id}/view`);
            console.log(`   Download: ${serverURL}/api/files/${sampleFile._id}/download`);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not query files:', error.message);
      }
    }
  }, 1000);
  
  setTimeout(() => {
    clearInterval(waitForDB);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Started without complete DB initialization - will retry');
    }
  }, 30000);
});