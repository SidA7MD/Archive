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

// MongoDB Atlas connection
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=university-archive`;

console.log('Attempting to connect to MongoDB Atlas...');
console.log('Host:', process.env.MONGO_HOST);
console.log('Database:', process.env.MONGO_DB_NAME);
console.log('Username:', process.env.MONGO_USERNAME);

mongoose.connect(MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB Atlas successfully');
})
.catch((error) => {
  console.error('MongoDB Atlas connection error:', error);
  console.error('Connection string (without password):', MONGO_URI.replace(process.env.MONGO_PASSWORD, '****'));
  
  // Don't exit immediately, let's try to continue and see if we can reconnect
  console.log('Continuing without database connection. Will retry...');
});

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB Atlas');
  console.log('Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB Atlas');
});

// Handle initial connection timeout
mongoose.connection.on('timeout', () => {
  console.error('❌ MongoDB connection timeout');
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

// Routes

// GET /api/semesters - List all semesters
app.get('/api/semesters', async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ order: 1 });
    res.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/semesters/:semesterId/types - List types by semester
app.get('/api/semesters/:semesterId/types', async (req, res) => {
  try {
    const types = await Type.find({ semester: req.params.semesterId })
      .populate('semester');
    res.json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects - List subjects
app.get('/api/semesters/:semesterId/types/:typeId/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({
      semester: req.params.semesterId,
      type: req.params.typeId
    }).populate(['semester', 'type']);
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years
app.get('/api/semesters/:semesterId/types/:typeId/subjects/:subjectId/years', async (req, res) => {
  try {
    const years = await Year.find({
      semester: req.params.semesterId,
      type: req.params.typeId,
      subject: req.params.subjectId
    }).populate(['semester', 'type', 'subject']).sort({ year: -1 });
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/years/:yearId/files - List files by year
app.get('/api/years/:yearId/files', async (req, res) => {
  try {
    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year']);
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload - Upload a PDF file
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/:fileId/download - Download a file
app.get('/api/files/:fileId/download', async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(file.filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/:fileId/view - View a file
app.get('/api/files/:fileId/view', async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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
  } catch (error) {
    console.error('Error initializing semesters:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB Atlas connection closed.');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Wait for database connection before initializing
  if (mongoose.connection.readyState === 1) {
    await initializeSemesters();
    console.log('Default semesters initialized');
  } else {
    mongoose.connection.once('connected', async () => {
      await initializeSemesters();
      console.log('Default semesters initialized');
    });
  }
});