const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  collectionName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  actionType: {
    type: String,
    enum: ['Enter Gallery', 'Download Photo', 'Download Gallery', 'Favorite Photo', 'Unfavorite Photo', 'Share Collection'],
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);
