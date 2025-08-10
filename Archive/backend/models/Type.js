const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['cours', 'tp', 'td', 'devoirs', 'compositions', 'ratrapages']
  },
  displayName: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Type', typeSchema);