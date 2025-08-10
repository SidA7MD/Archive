const express = require('express');
const router = express.Router();
const Type = require('../models/Type');

router.get('/:semesterId', async (req, res) => {
  try {
    const types = await Type.find({ semester: req.params.semesterId }).populate('semester');
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;