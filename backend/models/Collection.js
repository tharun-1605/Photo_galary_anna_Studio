const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  set: {
    type: String,
    default: 'Highlights'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const CollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  eventDate: {
    type: Date
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  photos: [PhotoSchema],
  sets: {
    type: [String],
    default: ['Highlights']
  },
  settings: {
    status: {
      type: String,
      enum: ['Published', 'Hidden', 'Draft'],
      default: 'Published'
    },
    password: {
      type: String,
      default: ''
    },
    downloads: {
      enabled: {
        type: Boolean,
        default: true
      },
      pin: {
        type: String,
        default: ''
      },
      sizes: {
        type: [String],
        enum: ['Web Size', 'High Res', 'Original'],
        default: ['Web Size']
      },
      requireEmail: {
        type: Boolean,
        default: true
      }
    },
    design: {
      coverStyle: {
        type: String,
        enum: ['Full Screen', 'Half Screen', 'Split Screen', 'Centered', 'Minimalist'],
        default: 'Full Screen'
      },
      typography: {
        type: String,
        enum: ['Classic', 'Modern', 'Editorial'],
        default: 'Modern'
      },
      colorPalette: {
        type: String,
        enum: ['Dark', 'Light', 'Warm', 'Cool'],
        default: 'Light'
      },
      gridSpacing: {
        type: String,
        enum: ['Normal', 'Compact', 'Loose'],
        default: 'Normal'
      }
    },
    favorites: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    socialSharing: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
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

// Update the updatedAt timestamp before saving
CollectionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Collection', CollectionSchema);
