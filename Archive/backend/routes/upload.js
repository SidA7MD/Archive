const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Semester = require('../models/Semester');
const Type = require('../models/Type');
const Subject = require('../models/Subject');
const Year = require('../models/Year');
const File = require('../models/File');

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

router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    const { semester, type, subject, year } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Find or create documents
    const semesterDoc = await Semester.findOne({ name: semester });
    if (!semesterDoc) return res.status(400).json({ error: 'Invalid semester' });

    const typeDisplayNames = {
      'cours': 'Cours', 'tp': 'Travaux Pratiques', 'td': 'Travaux Dirigés',
      'devoirs': 'Devoirs', 'compositions': 'Compositions', 'ratrapages': 'Rattrapages'
    };
    
    let typeDoc = await Type.findOne({ name: type, semester: semesterDoc._id });
    if (!typeDoc) {
      typeDoc = await new Type({
        name: type,
        displayName: typeDisplayNames[type],
        semester: semesterDoc._id
      }).save();
    }

    let subjectDoc = await Subject.findOne({
      name: subject,
      semester: semesterDoc._id,
      type: typeDoc._id
    });
    if (!subjectDoc) {
      subjectDoc = await new Subject({
        name: subject,
        semester: semesterDoc._id,
        type: typeDoc._id
      }).save();
    }

    let yearDoc = await Year.findOne({
      year: year,
      semester: semesterDoc._id,
      type: typeDoc._id,
      subject: subjectDoc._id
    });
    if (!yearDoc) {
      yearDoc = await new Year({
        year: year,
        semester: semesterDoc._id,
        type: typeDoc._id,
        subject: subjectDoc._id
      }).save();
    }

    const fileDoc = await new File({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      semester: semesterDoc._id,
      type: typeDoc._id,
      subject: subjectDoc._id,
      year: yearDoc._id
    }).save();

    res.status(201).json({ message: 'File uploaded successfully', file: fileDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;