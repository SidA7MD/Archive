const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');

router.get('/', async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ order: 1 });
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;