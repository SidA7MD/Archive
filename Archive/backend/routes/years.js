const express = require('express');
const router = express.Router();
const Year = require('../models/Year');

router.get('/:semesterId/:typeId/:subjectId', async (req, res) => {
  try {
    const years = await Year.find({
      semester: req.params.semesterId,
      type: req.params.typeId,
      subject: req.params.subjectId
    }).populate(['semester', 'type', 'subject']).sort({ year: -1 });
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;