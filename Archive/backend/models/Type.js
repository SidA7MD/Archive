const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique combination of name and semester
typeSchema.index({ name: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Type', typeSchema);