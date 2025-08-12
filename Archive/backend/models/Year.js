const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
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
  },
  displayName: {
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

// Compound index to ensure uniqueness
yearSchema.index({ year: 1, semester: 1, type: 1, subject: 1 }, { unique: true });

// Update the updatedAt field before saving
yearSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set displayName if not provided
  if (!this.displayName) {
    this.displayName = `Année ${this.year}`;
  }
  
  next();
});

module.exports = mongoose.model('Year', yearSchema);