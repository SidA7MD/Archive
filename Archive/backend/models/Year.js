const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    match: /^\d{4}(-\d{4})?$/ // 2024 or 2023-2024 format
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Year', yearSchema);