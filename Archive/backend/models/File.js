const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  // Cloudinary-specific fields
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
  },
  // Additional metadata
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
    default: 'document'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
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
  
  // Set category based on mimeType if not set
  if (!this.category || this.category === 'other') {
    if (this.mimeType.startsWith('image/')) {
      this.category = 'image';
    } else if (this.mimeType.startsWith('video/')) {
      this.category = 'video';
    } else if (this.mimeType.startsWith('audio/')) {
      this.category = 'audio';
    } else if (this.mimeType.includes('pdf') || this.mimeType.includes('document')) {
      this.category = 'document';
    } else if (this.mimeType.includes('zip') || this.mimeType.includes('archive')) {
      this.category = 'archive';
    }
  }
  
  next();
});

// Virtual for getting the correct download URL
fileSchema.virtual('downloadUrl').get(function() {
  if (this.storageProvider === 'cloudinary' && this.cloudinaryUrl) {
    // Add download flag for Cloudinary
    return this.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  return this.filePath;
});

// Virtual for getting the correct view URL
fileSchema.virtual('viewUrl').get(function() {
  if (this.storageProvider === 'cloudinary' && this.cloudinaryUrl) {
    return this.cloudinaryUrl;
  }
  return this.filePath;
});

// Virtual for getting file extension
fileSchema.virtual('extension').get(function() {
  const name = this.originalName || this.fileName || '';
  const lastDot = name.lastIndexOf('.');
  return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
});

// Virtual for getting formatted file size
fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Include virtuals when converting to JSON
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
fileSchema.index({ semester: 1, type: 1, subject: 1, year: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ originalName: 'text' });
fileSchema.index({ cloudinaryPublicId: 1 }, { sparse: true });

module.exports = mongoose.model('File', fileSchema);