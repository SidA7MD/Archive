const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
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
  code: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for name, semester, and type to ensure uniqueness
subjectSchema.index({ name: 1, semester: 1, type: 1 }, { unique: true });

// Update the updatedAt field before saving
subjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set displayName if not provided
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);