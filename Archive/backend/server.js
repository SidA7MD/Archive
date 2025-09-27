const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const url = require('url');
require('dotenv').config();

const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const https = require('https');
const http = require('http');

console.log('🚀 STARTING UNIVERSITY ARCHIVE SERVER - CLOUDINARY STORAGE');
console.log('🌥️ Using Cloudinary for File Storage');

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnsudmg3p',
  api_key: process.env.CLOUDINARY_API_KEY || '211427178253455',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dLYmuWERn7Hfd_W8G80vZF4ETxU',
});

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

// File model schema for Cloudinary storage
const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, index: true },
  cloudinaryPublicId: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  mimeType: { type: String, default: 'application/pdf' },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true, index: true },
  storageProvider: { type: String, default: 'cloudinary' },
  uploadedAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});
fileSchema.index({ semester: 1, type: 1, subject: 1, year: 1 });
fileSchema.index({ uploadedAt: -1 });
File = mongoose.model('File', fileSchema);

// Multer setup for memory storage
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

// Helper function to detect mobile devices
const isMobileDevice = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// ENHANCED: Super robust filename sanitization with GUARANTEED .pdf extension
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'document.pdf';
  
  // Aggressive cleaning
  let sanitized = filename
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Replace dangerous characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\-_().]/g, '_') // Only allow safe characters
    .trim();
  
  // Handle reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL'];
  const nameWithoutExt = sanitized.replace(/\.[^.]*$/, '').toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }
  
  // Remove any existing extension and force .pdf
  sanitized = sanitized.replace(/\.[^.]*$/, '');
  
  // If empty, use default
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'document';
  }
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  // FORCE .pdf extension
  return sanitized + '.pdf';
}

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
    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();
      
    const baseURL = getBaseURL(req);
    res.json(files.map(file => ({
      ...file,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      fileType: 'pdf'
    })));
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
    res.json({
      files: files.map(file => ({
        ...file,
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        fileType: 'pdf'
      })),
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

// ENHANCED PDF DOWNLOAD ROUTE - Guaranteed .pdf extension across all browsers
app.get('/api/files/:fileId/download', requireDB, async (req, res) => {
  const fileId = req.params.fileId;
  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }
    
    const file = await File.findById(fileId).lean();
    if (!file) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    
    // ENHANCED: Super aggressive filename sanitization with GUARANTEED .pdf extension
    const ensurePdfExtension = (filename) => {
      if (!filename || typeof filename !== 'string') return 'document.pdf';
      
      // Remove dangerous characters and normalize
      let clean = filename
        .replace(/[/\\]/g, '') // Path separators
        .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Dangerous chars
        .replace(/^\.+/, '') // Leading dots
        .replace(/\s+/g, '_') // Spaces to underscores
        .replace(/[^\w\-_().]/g, '_') // Only safe characters
        .trim();
      
      // Remove existing extension completely and force .pdf
      clean = clean.replace(/\.[^.]*$/, '');
      
      // If name is empty, use default
      if (!clean || clean.length === 0) {
        clean = 'document';
      }
      
      // Limit length and add .pdf
      if (clean.length > 200) {
        clean = clean.substring(0, 200);
      }
      
      // FORCE .pdf extension - this is critical
      return clean + '.pdf';
    };
    
    const filename = ensurePdfExtension(file.originalName);
    console.log(`📥 Download request - Original: "${file.originalName}" -> Processed: "${filename}"`);
    
    // Parse Cloudinary URL
    const parsedUrl = url.parse(file.cloudinaryUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'University Archive PDF Downloader/3.3.0',
        'Accept': 'application/pdf,*/*',
        'Cache-Control': 'no-cache'
      }
    };
    
    console.log(`🔄 Fetching from Cloudinary: ${file.cloudinaryUrl}`);
    
    const request = client.request(requestOptions, (cloudinaryRes) => {
      if (cloudinaryRes.statusCode !== 200) {
        console.error(`❌ Cloudinary error: ${cloudinaryRes.statusCode}`);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Erreur lors du téléchargement du fichier',
            cloudinaryStatus: cloudinaryRes.statusCode 
          });
        }
        return;
      }
      
      // CRITICAL: Set headers BEFORE any data is sent
      // Force PDF content type
      res.setHeader('Content-Type', 'application/pdf');
      
      // Multiple filename encoding strategies for maximum compatibility
      const safeFilename = filename.replace(/[^\x00-\x7F]/g, '_'); // ASCII fallback
      const encodedFilename = encodeURIComponent(filename);
      
      // ENHANCED: Multiple Content-Disposition strategies
      // Strategy 1: RFC 6266 compliant with UTF-8 support
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      
      // Strategy 2: Additional mobile-specific headers
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Suggested-Filename', filename);
      
      // Strategy 3: Force download behavior
      res.setHeader('Content-Description', 'File Transfer');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      // Length if available
      if (cloudinaryRes.headers['content-length']) {
        res.setHeader('Content-Length', cloudinaryRes.headers['content-length']);
      }
      
      // Cache and security headers
      res.setHeader('Cache-Control', 'private, max-age=3600, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // CORS headers for cross-origin downloads
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Expose-Headers', 
        'Content-Disposition, Content-Type, Content-Length, X-Suggested-Filename'
      );
      
      // Additional browser-specific compatibility headers
      const userAgent = req.headers['user-agent'] || '';
      
      // Safari-specific headers
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      
      // Chrome mobile specific
      if (userAgent.includes('Chrome') && userAgent.includes('Mobile')) {
        res.setHeader('Content-Disposition', 
          `attachment; filename*=UTF-8''${encodedFilename}; filename="${safeFilename}"`
        );
      }
      
      // Firefox specific
      if (userAgent.includes('Firefox')) {
        res.setHeader('Content-Disposition', 
          `attachment; filename*=UTF-8''${encodedFilename}`
        );
      }
      
      // Edge/IE specific  
      if (userAgent.includes('Edge') || userAgent.includes('Trident')) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);
      }
      
      console.log(`✅ Headers set for PDF download:`, {
        filename: filename,
        contentType: res.getHeader('Content-Type'),
        contentDisposition: res.getHeader('Content-Disposition'),
        userAgent: userAgent.substring(0, 100),
        contentLength: res.getHeader('Content-Length')
      });
      
      // Error handling for streaming
      cloudinaryRes.on('error', (streamError) => {
        console.error(`❌ Stream error: ${streamError.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de streaming' });
        } else {
          res.destroy();
        }
      });
      
      res.on('error', (resError) => {
        console.error(`❌ Response error: ${resError.message}`);
        cloudinaryRes.destroy();
      });
      
      // Handle client disconnect
      res.on('close', () => {
        if (!cloudinaryRes.destroyed) {
          cloudinaryRes.destroy();
        }
      });
      
      // Stream the file content
      cloudinaryRes.pipe(res);
    });
    
    request.on('error', (error) => {
      console.error(`❌ Request error: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Erreur lors du téléchargement', 
          message: error.message 
        });
      }
    });
    
    request.on('timeout', () => {
      console.error('❌ Request timeout');
      request.destroy();
      if (!res.headersSent) {
        res.status(408).json({ error: 'Timeout lors du téléchargement' });
      }
    });
    
    request.setTimeout(30000);
    request.end();
    
  } catch (error) {
    console.error(`❌ Download error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erreur lors du téléchargement',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
      });
    }
  }
});

// POST /api/upload - Upload PDF to Cloudinary
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
    const { semester, type, subject, year } = req.body || {};
    if (!semester || !type || !subject || !year) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        required: ['semester', 'type', 'subject', 'year']
      });
    }

    // Upload to Cloudinary
    try {
      const uploadStreamPromise = () => new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'pdfs',
            public_id: `pdf-${Date.now()}-${Math.round(Math.random()*1e9)}`,
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(req.file.buffer).pipe(uploadStream);
      });

      const cloudinaryFile = await uploadStreamPromise();

      // Create database references
      const session = await mongoose.startSession();
      let savedFile;
      await session.withTransaction(async () => {
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
            'cours': 'Cours', 'tp': 'Travaux Pratiques', 'td': 'Travaux Dirigés',
            'devoirs': 'Devoirs', 'compositions': 'Compositions', 'ratrapages': 'Rattrapages'
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
        // Create file document with properly sanitized filename
        const fileDoc = new File({
          originalName: sanitizeFilename(req.file.originalname),
          cloudinaryPublicId: cloudinaryFile.public_id,
          cloudinaryUrl: cloudinaryFile.secure_url,
          fileSize: req.file.size,
          mimeType: 'application/pdf',
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          storageProvider: 'cloudinary',
          uploadedAt: new Date()
        });
        savedFile = await fileDoc.save({ session });
        await savedFile.populate(['semester', 'type', 'subject', 'year']);
      });
      await session.endSession();
      
      const baseURL = getBaseURL(req);
      const responseFile = {
        ...savedFile.toObject(),
        downloadUrl: `${baseURL}/api/files/${savedFile._id}/download`,
        fileType: 'pdf'
      };
      res.status(201).json({ 
        message: 'Fichier uploadé avec succès',
        file: responseFile
      });
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'upload',
        message: error.message || 'Erreur interne'
      });
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
          originalName: sanitizeFilename(originalName),
          semester: semesterDoc._id,
          type: typeDoc._id,
          subject: subjectDoc._id,
          year: yearDoc._id,
          mimeType: 'application/pdf',
          updatedAt: new Date()
        },
        { new: true, session }
      ).populate(['semester', 'type', 'subject', 'year']);
      
      const baseURL = getBaseURL(req);
      res.json({
        message: 'Fichier mis à jour avec succès',
        file: {
          ...updatedFile.toObject(),
          downloadUrl: `${baseURL}/api/files/${updatedFile._id}/download`,
          fileType: 'pdf'
        }
      });
    });
    await session.endSession();
  } catch (error) {
    console.error('❌ File update failed:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour',
      message: error.message || 'Erreur interne'
    });
  }
});

// DELETE /api/files/:fileId - Delete file from Cloudinary and database
app.delete('/api/files/:fileId', requireDB, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    let cloudinaryDeleted = false;
    try {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, { resource_type: 'raw' });
      cloudinaryDeleted = true;
    } catch (error) {
      console.warn('⚠️ Cloudinary deletion failed:', error.message);
    }
    await File.findByIdAndDelete(req.params.fileId);
    res.json({ 
      message: 'Fichier supprimé avec succès',
      cloudinaryDeleted,
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
    const files = await File.find()
      .populate(['semester', 'type', 'subject', 'year'])
      .sort({ uploadedAt: -1 })
      .lean();
    
    const baseURL = getBaseURL(req);
    res.json(files.map(file => ({
      ...file,
      downloadUrl: `${baseURL}/api/files/${file._id}/download`,
      fileType: 'pdf'
    })));
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
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        fileType: 'pdf',
        fileSizeFormatted: formatFileSize(file.fileSize || 0)
      })),
      storageProvider: 'Cloudinary',
      baseURL
    });
  } catch (error) {
    console.error('❌ Stats fetch failed:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ENHANCED: Test endpoint to verify PDF download behavior
app.get('/api/test/download/:fileId', requireDB, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    const originalName = file.originalName;
    const sanitizedName = sanitizeFilename(originalName);
    const encodedName = encodeURIComponent(sanitizedName);
    
    // Test different Content-Disposition formats
    const dispositions = [
      `attachment; filename="${sanitizedName}"`,
      `attachment; filename*=UTF-8''${encodedName}`,
      `attachment; filename="${sanitizedName}"; filename*=UTF-8''${encodedName}`
    ];
    
    res.json({
      fileId: file._id,
      testing: {
        originalFilename: originalName,
        sanitizedFilename: sanitizedName,
        encodedFilename: encodedName,
        hasPdfExtension: sanitizedName.endsWith('.pdf'),
        testDispositions: dispositions
      },
      userAgent: req.headers['user-agent'],
      downloadUrl: `${getBaseURL(req)}/api/files/${file._id}/download`,
      recommendations: [
        'Test download on different browsers',
        'Check file extension in downloads folder',
        'Verify PDF can be opened after download'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced debug endpoint
app.get('/api/debug/files/:fileId', requireDB, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.json({ error: 'File not found in DB' });
    
    const baseURL = getBaseURL(req);
    const sanitizedName = sanitizeFilename(file.originalName);
    const encodedFilename = encodeURIComponent(sanitizedName);
    const asciiFilename = sanitizedName.replace(/[^\x00-\x7F]/g, '_');
    
    res.json({
      database: {
        id: file._id,
        originalName: file.originalName,
        sanitizedName: sanitizedName,
        cloudinaryPublicId: file.cloudinaryPublicId,
        cloudinaryUrl: file.cloudinaryUrl,
        fileSize: file.fileSize,
        storageProvider: file.storageProvider,
        mimeType: file.mimeType || 'application/pdf',
        uploadedAt: file.uploadedAt
      },
      urls: {
        download: `${baseURL}/api/files/${file._id}/download`,
        direct: file.cloudinaryUrl,
        test: `${baseURL}/api/test/download/${file._id}`
      },
      filenameHandling: {
        original: file.originalName,
        sanitized: sanitizedName,
        encoded: encodedFilename,
        ascii: asciiFilename,
        hasPdfExtension: sanitizedName.toLowerCase().endsWith('.pdf'),
        length: sanitizedName.length
      },
      deviceDetection: {
        isMobile: isMobileDevice(req),
        userAgent: req.headers['user-agent']
      },
      headers: {
        expectedContentType: 'application/pdf',
        expectedContentDisposition: `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        corsOrigin: req.headers.origin || '*'
      },
      testCases: {
        'test.pdf': sanitizeFilename('test.pdf'),
        'test': sanitizeFilename('test'),
        'test.doc': sanitizeFilename('test.doc'),
        'test<>file.pdf': sanitizeFilename('test<>file.pdf'),
        '': sanitizeFilename(''),
        'Structures AlgéBriques.pdf': sanitizeFilename('Structures AlgéBriques.pdf')
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  let dbError = null;
  let sampleFiles = [];
  if (dbStatus === 1) {
    try {
      const fileCount = await File.countDocuments();
      sampleFiles = await File.find()
        .limit(3)
        .select('_id originalName cloudinaryPublicId cloudinaryUrl fileSize')
        .lean();
    } catch (error) {
      dbError = error.message;
    }
  }
  const overallStatus = (dbStatus === 1) ? 'OK' : 'Warning';
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
        provider: 'Cloudinary',
        status: 'Ready',
        ready: true
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.env.RENDER_EXTERNAL_URL ? 'Render.com' : 
                process.env.VERCEL ? 'Vercel' :
                process.env.HEROKU_APP_NAME ? 'Heroku' : 'Other',
      external_url: process.env.RENDER_EXTERNAL_URL || null,
      detected_host: req.get('host'),
      working_directory: process.cwd(),
    },
    testing: {
      sampleFiles: sampleFiles.map(file => ({
        id: file._id,
        name: file.originalName,
        sanitizedName: sanitizeFilename(file.originalName),
        cloudinaryPublicId: file.cloudinaryPublicId,
        cloudinaryUrl: file.cloudinaryUrl,
        size: file.fileSize,
        downloadUrl: `${baseURL}/api/files/${file._id}/download`,
        testUrl: `${baseURL}/api/test/download/${file._id}`
      }))
    },
    uptime: Math.floor(process.uptime()),
    version: '3.3.0-enhanced-pdf-download-guaranteed'
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
      download: '/api/files/:fileId/download',
      debug: '/api/debug/files/:fileId',
      test: '/api/test/download/:fileId'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🎓 UNIVERSITY ARCHIVE SERVER - CLOUDINARY STORAGE SOLUTION`);
  console.log(`🚀 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  const serverURL = process.env.RENDER_EXTERNAL_URL || 
    (process.env.NODE_ENV === 'production' ? `https://archive-mi73.onrender.com` : `http://localhost:${PORT}`);
  console.log(`🔗 Server URL: ${serverURL}`);
  console.log(`🌥️ Storage: Cloudinary`);
  console.log(`📄 PDF Download: ENHANCED .pdf extension handling for ALL devices & browsers`);
  console.log(`🔧 Version: 3.3.0-enhanced-pdf-download-guaranteed`);
  
  // Wait for DB then initialize semesters
  const waitForDB = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(waitForDB);
      console.log('🔧 Initializing application...');
      await initializeSemesters();
      console.log('🎯 Server ready for requests');
      console.log('🩺 Health check:', `${serverURL}/api/health`);
      try {
        const fileCount = await File.countDocuments();
        console.log(`📊 Database contains ${fileCount} files`);
        if (fileCount > 0) {
          const sampleFile = await File.findOne().lean();
          if (sampleFile) {
            console.log('📝 Test URLs:');
            console.log(`   Download: ${serverURL}/api/files/${sampleFile._id}/download`);
            console.log(`   Debug: ${serverURL}/api/debug/files/${sampleFile._id}`);
            console.log(`   Test: ${serverURL}/api/test/download/${sampleFile._id}`);
            console.log(`   Original filename: ${sampleFile.originalName}`);
            console.log(`   Sanitized filename: ${sanitizeFilename(sampleFile.originalName)}`);
          }
        }
      } catch (error) {
        console.log('⚠️ Could not query files:', error.message);
      }
      console.log('\n📋 AVAILABLE ENDPOINTS:');
      console.log(`   Health: GET ${serverURL}/api/health`);
      console.log(`   Files: GET ${serverURL}/api/files`);
      console.log(`   Upload: POST ${serverURL}/api/upload`);
      console.log(`   Download: GET ${serverURL}/api/files/:fileId/download`);
      console.log(`   Semesters: GET ${serverURL}/api/semesters`);
      console.log(`   Admin Stats: GET ${serverURL}/api/admin/stats`);
      console.log(`   Debug File: GET ${serverURL}/api/debug/files/:fileId`);
      console.log(`   Test Download: GET ${serverURL}/api/test/download/:fileId`);
      console.log('\n🎯 ENHANCED FIX APPLIED:');
      console.log('   ✅ Multiple browser-specific Content-Disposition headers');
      console.log('   ✅ Aggressive filename sanitization with guaranteed .pdf extension');
      console.log('   ✅ Enhanced mobile device compatibility');
      console.log('   ✅ Advanced character encoding handling');
      console.log('   ✅ Cross-browser download optimization');
    }
  }, 1000);
  
  setTimeout(() => {
    clearInterval(waitForDB);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Started without complete DB initialization - will continue retrying');
      console.log('💡 Server will continue to attempt database reconnection');
    }
  }, 30000);

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    console.log('🔄 Server will continue running...');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    console.log('🔄 Server will continue running...');
  });
});

// Export app for testing purposes
module.exports = app;