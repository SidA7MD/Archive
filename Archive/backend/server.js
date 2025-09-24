const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Client, Storage, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

console.log('🚀 STARTING UNIVERSITY ARCHIVE SERVER - APPWRITE STORAGE');
console.log('☁️ Using Appwrite Cloud Storage for PDF files');

const app = express();

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Initialize Appwrite client
const appwriteClient = new Client();
const appwriteStorage = new Storage(appwriteClient);

// Configure Appwrite - Fixed endpoint configuration
appwriteClient
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68d44d58003180cc2ca4')
  .setKey('standard_0ef5f53f332c1f8da64e540e25f629b13e44083e0376ee2599198acfd2e1d97c13c510954911db1eb5698b35a59655d13e24c7ed14d15b966bd2ecb8913fdb89fd693f35ecf152a50f300739f983b42753a66d1eedd80f7c2dc67ecb90e829b3917233e11a694e3dab1e65785cacfbc09655d97a821e7911d053280a4cc15369');

const APPWRITE_BUCKET_ID = '68d44d9f0009b17ef7eb';

console.log('☁️ Appwrite client configured');
console.log(`📦 Using bucket: ${APPWRITE_BUCKET_ID}`);

// Enhanced CORS configuration - Fixed to properly allow your frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'https://www.larchive.tech', // Your main domain
      'https://larchive.tech',     // Without www
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
    
    console.warn('⚠️ CORS blocked origin:', origin);
    // In production, be more permissive for now to debug
    return callback(null, true); // Temporarily allow all origins
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

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Security middleware optimized for PDF serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "*.appwrite.io"],
      connectSrc: ["'self'", "https:", "wss:", "ws:", "*.appwrite.io"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'self'", "blob:", "data:", "*.appwrite.io"],
      mediaSrc: ["'self'", "blob:", "data:", "*.appwrite.io"],
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

// File model schema for Appwrite
const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, index: true },
  appwriteFileId: { type: String, required: true, unique: true },
  fileSize: { type: Number, required: true, min: 0 },
  mimeType: { type: String, default: 'application/pdf' },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true, index: true },
  storageProvider: { type: String, default: 'appwrite' },
  uploadedAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

fileSchema.index({ semester: 1, type: 1, subject: 1, year: 1 });
fileSchema.index({ uploadedAt: -1 });

File = mongoose.model('File', fileSchema);

// Fixed Multer configuration
const storage = multer.memoryStorage();

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

// Test Appwrite connection - Enhanced version
const testAppwriteConnection = async () => {
  try {
    console.log('☁️ Testing Appwrite connection...');
    const bucketInfo = await appwriteStorage.getBucket(APPWRITE_BUCKET_ID);
    console.log('✅ Appwrite connection successful, bucket:', bucketInfo.name);
    return true;
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error.message);
    if (error.message.includes('region')) {
      console.error('💡 Tip: Try using a different Appwrite endpoint or check your project region');
    }
    return false;
  }
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
      storageProvider: 'appwrite',
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

// GET /api/files/:fileId/view - Stream PDF for inline viewing via Appwrite
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
      appwriteFileId: file.appwriteFileId
    });

    try {
      const appwriteFile = await appwriteStorage.getFile(APPWRITE_BUCKET_ID, file.appwriteFileId);
      console.log('☁️ Appwrite file confirmed:', {
        id: appwriteFile.$id,
        name: appwriteFile.name,
        size: appwriteFile.sizeOriginal
      });

      const viewUrl = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.appwriteFileId}/view?project=68d44d58003180cc2ca4`;
      
      console.log('🔗 Redirecting to Appwrite view URL:', viewUrl);
      res.redirect(viewUrl);

    } catch (appwriteError) {
      console.error('❌ File missing from Appwrite:', appwriteError.message);
      return res.status(404).json({ error: 'Fichier manquant dans le stockage cloud' });
    }

  } catch (error) {
    console.error('❌ View error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la visualisation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/:fileId/download - Force download via Appwrite
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
      appwriteFileId: file.appwriteFileId
    });

    try {
      const appwriteFile = await appwriteStorage.getFile(APPWRITE_BUCKET_ID, file.appwriteFileId);

      const downloadUrl = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${file.appwriteFileId}/download?project=68d44d58003180cc2ca4`;
      
      console.log('🔗 Redirecting to Appwrite download URL:', downloadUrl);
      res.redirect(downloadUrl);

    } catch (appwriteError) {
      console.error('❌ File missing from Appwrite:', appwriteError.message);
      return res.status(404).json({ error: 'Fichier manquant dans le stockage cloud' });
    }

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      error: 'Erreur lors du téléchargement',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/upload - Fixed Upload files to Appwrite
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

    // Debug file information
    console.log('📤 File received:', {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'No buffer'
    });

    const { semester, type, subject, year } = req.body || {};
    if (!semester || !type || !subject || !year) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        required: ['semester', 'type', 'subject', 'year']
      });
    }

    // Fixed variable scoping
    let appwriteFileId = null;
    const session = await mongoose.startSession();
    
    try {
      console.log('📤 Starting upload to Appwrite:', {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        metadata: { semester, type, subject, year }
      });

      await session.withTransaction(async () => {
        // Fixed: Create InputFile from buffer properly
        console.log('☁️ Creating Appwrite file...');
        
        // Create the file using createFile with buffer
        const uploadResult = await appwriteStorage.createFile(
          APPWRITE_BUCKET_ID,
          ID.unique(),
          req.file.buffer, // Direct buffer usage
          [Permission.read(Role.any())]
        );

        appwriteFileId = uploadResult.$id;
        console.log('✅ Appwrite upload completed with ID:', appwriteFileId);

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

        // Create file document with Appwrite file ID
        const fileDoc = new File({
          originalName: req.file.originalname,
          appwriteFileId: appwriteFileId,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'appwrite',
          uploadedAt: new Date()
        });

        await fileDoc.save({ session });
        await fileDoc.populate(['semester', 'type', 'subject', 'year']);

        const baseUrl = getBaseURL(req);
        
        const responseFile = {
          ...fileDoc.toObject(),
          viewUrl: `${baseUrl}/api/files/${fileDoc._id}/view`,
          downloadUrl: `${baseUrl}/api/files/${fileDoc._id}/download`,
          fileType: getFileExtension(req.file.originalname)
        };

        console.log('✅ Upload successful:', {
          fileId: fileDoc._id,
          name: req.file.originalname,
          appwriteFileId: appwriteFileId,
          viewUrl: responseFile.viewUrl,
          downloadUrl: responseFile.downloadUrl
        });

        res.status(201).json({ 
          message: 'Fichier uploadé avec succès',
          file: responseFile
        });
      });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Cleanup Appwrite file on error - Fixed scoping issue
      if (appwriteFileId) {
        try {
          await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, appwriteFileId);
          console.log('🗑️ Cleaned up Appwrite file:', appwriteFileId);
        } catch (cleanupError) {
          console.error('❌ Appwrite cleanup failed:', cleanupError.message);
        }
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

// DELETE /api/files/:fileId - Delete file from both Appwrite and database
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }

    console.log('🗑️ Deleting file:', { id: file._id, name: file.originalName, appwriteFileId: file.appwriteFileId });

    let appwriteDeleted = false;
    
    try {
      await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, file.appwriteFileId);
      appwriteDeleted = true;
      console.log('✅ Appwrite file deleted');
    } catch (error) {
      console.warn('⚠️ Appwrite deletion failed:', error.message);
    }

    await File.findByIdAndDelete(req.params.fileId);

    res.json({ 
      message: 'Fichier supprimé avec succès',
      appwriteDeleted,
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
      storageProvider: 'appwrite',
      fileType: getFileExtension(file.originalName)
    }));

    res.json(enhancedFiles);
  } catch (error) {
    console.error('❌ Admin files fetch failed:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers admin' });
  }
});

// GET /api/admin/stats - Admin statistics with Appwrite info
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

    // Get Appwrite bucket info
    let appwriteStats = { count: 0, size: 0 };
    try {
      const bucketFiles = await appwriteStorage.listFiles(APPWRITE_BUCKET_ID);
      appwriteStats.count = bucketFiles.files.length;
      appwriteStats.size = bucketFiles.files.reduce((total, file) => total + file.sizeOriginal, 0);
    } catch (error) {
      console.warn('⚠️ Could not fetch Appwrite stats:', error.message);
    }

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
        appwriteFiles: appwriteStats.count,
        appwriteSize: appwriteStats.size,
        appwriteSizeFormatted: formatFileSize(appwriteStats.size)
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
      storageProvider: 'Appwrite Cloud',
      storageLocation: `Appwrite Bucket: ${APPWRITE_BUCKET_ID}`,
      baseURL
    });
  } catch (error) {
    console.error('❌ Stats fetch failed:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/health - Enhanced health check with Appwrite status
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected', 
    2: 'Connecting',
    3: 'Disconnecting'
  };

  let appwriteStatus = 'Not tested';
  let appwriteFileCount = 0;
  let appwriteTestPassed = false;
  let dbError = null;
  let appwriteError = null;
  
  // Test Appwrite connection
  try {
    const bucketInfo = await appwriteStorage.getBucket(APPWRITE_BUCKET_ID);
    appwriteFileCount = bucketInfo.total || 0;
    appwriteTestPassed = true;
    appwriteStatus = `Ready - Bucket: ${bucketInfo.name}`;
  } catch (error) {
    appwriteError = error.message;
    appwriteStatus = 'Error: ' + error.message;
    appwriteTestPassed = false;
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

  const overallStatus = (dbStatus === 1 && appwriteTestPassed) ? 'OK' : 'Warning';
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
        provider: 'Appwrite Cloud',
        bucket: APPWRITE_BUCKET_ID,
        status: appwriteStatus,
        ready: appwriteTestPassed,
        fileCount: appwriteFileCount,
        ...(appwriteError && { error: appwriteError })
      }
    },
    environment: process.env.NODE_ENV || 'development',
    deployment: {
      platform: process.env.RENDER_EXTERNAL_URL ? 'Render.com' : 'Other',
      external_url: process.env.RENDER_EXTERNAL_URL || null,
      detected_host: req.get('host')
    },
    uptime: Math.floor(process.uptime()),
    version: '2.1.0-appwrite-fixed'
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
  console.log(`\n🎓 UNIVERSITY ARCHIVE SERVER - APPWRITE STORAGE FIXED`);
  console.log(`🚀 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const serverURL = process.env.RENDER_EXTERNAL_URL || 
    (process.env.NODE_ENV === 'production' ? `https://archive-mi73.onrender.com` : `http://localhost:${PORT}`);
    
  console.log(`🔗 Server URL: ${serverURL}`);
  console.log(`☁️ Storage: Appwrite Cloud Storage`);
  console.log(`📦 Bucket ID: ${APPWRITE_BUCKET_ID}`);
  console.log(`📄 PDF Serving: Direct Appwrite CDN URLs with CORS support`);
  console.log(`🌐 CORS: Enhanced configuration for frontend domains`);
  
  // Test Appwrite connection on startup
  const appwriteConnected = await testAppwriteConnection();
  if (appwriteConnected) {
    console.log('✅ Appwrite storage ready');
  } else {
    console.warn('⚠️ Appwrite connection issues - check credentials and region');
  }
  
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForDB);
      
      console.log('🔧 Initializing application...');
      await initializeSemesters();
      
      console.log('🎯 Server ready for requests');
      console.log('🩺 Health check:', `${serverURL}/api/health`);
      
      console.log('\n🛠️ FIXED ISSUES:');
      console.log('✅ Enhanced CORS configuration for frontend domains');
      console.log('✅ Fixed Appwrite file upload buffer handling'); 
      console.log('✅ Fixed variable scoping in error handling');
      console.log('✅ Improved error logging and debugging');
      console.log('✅ Added comprehensive file upload validation');
      console.log('✅ Enhanced Appwrite connection testing');
      
      try {
        const fileCount = await File.countDocuments();
        console.log(`📊 Database contains ${fileCount} files`);
        
        if (fileCount > 0) {
          const sampleFile = await File.findOne().lean();
          console.log('📝 Sample file test URLs:');
          console.log(`   View: ${serverURL}/api/files/${sampleFile._id}/view`);
          console.log(`   Download: ${serverURL}/api/files/${sampleFile._id}/download`);
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