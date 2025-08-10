const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['S1', 'S2', 'S3', 'S4', 'S5'] // Fixed 5 semesters
  },
  displayName: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);