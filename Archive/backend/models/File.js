const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  // New Cloudinary-specific fields
  cloudinaryPublicId: {
    type: String,
    required: function() {
      return this.filePath && this.filePath.includes('cloudinary.com');
    }
  },
  cloudinaryUrl: {
    type: String,
    required: function() {
      return this.filePath && this.filePath.includes('cloudinary.com');
    }
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
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
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Storage provider info
  storageProvider: {
    type: String,
    enum: ['local', 'cloudinary'],
    default: function() {
      return this.filePath && this.filePath.includes('cloudinary.com') ? 'cloudinary' : 'local';
    }
  }
});

// Update the updatedAt field before saving
fileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-set storage provider based on filePath
  if (this.filePath && this.filePath.includes('cloudinary.com')) {
    this.storageProvider = 'cloudinary';
  } else {
    this.storageProvider = 'local';
  }
  
  next();
});

// Virtual for getting the correct URL based on storage provider
fileSchema.virtual('downloadUrl').get(function() {
  if (this.storageProvider === 'cloudinary' && this.cloudinaryUrl) {
    // Add download flag for Cloudinary
    return this.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  return this.filePath;
});

fileSchema.virtual('viewUrl').get(function() {
  if (this.storageProvider === 'cloudinary' && this.cloudinaryUrl) {
    return this.cloudinaryUrl;
  }
  return this.filePath;
});

// Include virtuals when converting to JSON
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);