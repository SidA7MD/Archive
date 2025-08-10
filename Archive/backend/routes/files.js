const express = require('express');
const router = express.Router();
const File = require('../models/File');

router.get('/:yearId', async (req, res) => {
  try {
    const files = await File.find({ year: req.params.yearId })
      .populate(['semester', 'type', 'subject', 'year']);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;