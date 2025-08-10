const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

router.get('/:semesterId/:typeId', async (req, res) => {
  try {
    const subjects = await Subject.find({
      semester: req.params.semesterId,
      type: req.params.typeId
    }).populate(['semester', 'type']);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;