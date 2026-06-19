const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  photoUrls: {
    type: [String],
    default: []
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

FavoriteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure uniqueness per client per collection
FavoriteSchema.index({ collectionId: 1, clientEmail: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
