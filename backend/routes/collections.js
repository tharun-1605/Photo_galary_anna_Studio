const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Collection = require('../models/Collection');
const { protect } = require('../middleware/auth');

// Helper to generate a slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max size
});

// @desc    Get all collections
// @route   GET /api/collections
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const collections = await Collection.find({}).sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get collection by ID
// @route   GET /api/collections/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const collection = await Collection.findById(req.id || req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a collection
// @route   POST /api/collections
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, eventDate } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Collection name is required' });
  }

  try {
    let slug = slugify(name);

    // Ensure slug uniqueness
    let slugExists = await Collection.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${slugify(name)}-${counter}`;
      slugExists = await Collection.findOne({ slug });
      counter++;
    }

    const collection = await Collection.create({
      name,
      slug,
      eventDate: eventDate || undefined,
      sets: ['Highlights'],
      settings: {
        status: 'Published',
        downloads: {
          enabled: true,
          pin: '',
          sizes: ['Web Size'],
          requireEmail: true
        },
        design: {
          coverStyle: 'Full Screen',
          typography: 'Modern',
          colorPalette: 'Light',
          gridSpacing: 'Normal'
        },
        favorites: {
          enabled: true
        },
        socialSharing: {
          enabled: true
        }
      }
    });

    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update collection settings
// @route   PUT /api/collections/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const { name, eventDate, settings, sets } = req.body;

    if (name) {
      collection.name = name;
      // Optionally update slug if name changes and it's draft? Usually better to keep slug stable or update carefully
    }

    if (eventDate !== undefined) {
      collection.eventDate = eventDate;
    }

    if (settings) {
      // Merge settings to prevent overwriting other nested attributes
      collection.settings = {
        status: settings.status || collection.settings.status,
        password: settings.password !== undefined ? settings.password : collection.settings.password,
        downloads: {
          ...collection.settings.downloads,
          ...settings.downloads
        },
        design: {
          ...collection.settings.design,
          ...settings.design
        },
        favorites: {
          ...collection.settings.favorites,
          ...settings.favorites
        },
        socialSharing: {
          ...collection.settings.socialSharing,
          ...settings.socialSharing
        }
      };
    }

    if (sets) {
      collection.sets = sets;
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete collection (removes upload files too)
// @route   DELETE /api/collections/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Delete photos files from disk
    collection.photos.forEach(photo => {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      }
    });

    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection and associated photos deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload photos to collection
// @route   POST /api/collections/:id/photos
// @access  Private
router.post('/:id/photos', protect, upload.array('photos', 50), async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const currentSet = req.body.set || 'Highlights';

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No photos uploaded' });
    }

    const newPhotos = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      set: currentSet
    }));

    collection.photos.push(...newPhotos);

    // If no cover photo is set, make the first uploaded photo the cover photo
    if (!collection.coverPhoto && collection.photos.length > 0) {
      collection.coverPhoto = collection.photos[0].url;
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a photo's metadata (e.g. moving it to a set)
// @route   PUT /api/collections/:id/photos/:photoId
// @access  Private
router.put('/:id/photos/:photoId', protect, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const photo = collection.photos.id(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const { set } = req.body;
    if (set) {
      photo.set = set;
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a single photo
// @route   DELETE /api/collections/:id/photos/:photoId
// @access  Private
router.delete('/:id/photos/:photoId', protect, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const photo = collection.photos.id(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }

    // Remove photo from subdocument array
    photo.deleteOne();

    // If deleted photo was the cover photo, reset cover photo to first photo, or empty if none left
    if (collection.coverPhoto === photo.url) {
      collection.coverPhoto = collection.photos.length > 0 ? collection.photos[0].url : '';
    }

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Set collection cover photo
// @route   PUT /api/collections/:id/cover
// @access  Private
router.put('/:id/cover', protect, async (req, res) => {
  const { coverPhoto } = req.body;

  if (!coverPhoto) {
    return res.status(400).json({ message: 'Cover photo url is required' });
  }

  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    collection.coverPhoto = coverPhoto;
    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a set name
// @route   POST /api/collections/:id/sets
// @access  Private
router.post('/:id/sets', protect, async (req, res) => {
  const { setName } = req.body;

  if (!setName) {
    return res.status(400).json({ message: 'Set name is required' });
  }

  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.sets.includes(setName)) {
      return res.status(400).json({ message: 'Set already exists' });
    }

    collection.sets.push(setName);
    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a set and reassign its photos to 'Highlights' or another set
// @route   DELETE /api/collections/:id/sets/:setName
// @access  Private
router.delete('/:id/sets/:setName', protect, async (req, res) => {
  const { setName } = req.params;

  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (setName === 'Highlights') {
      return res.status(400).json({ message: 'Cannot delete default set "Highlights"' });
    }

    // Filter sets
    collection.sets = collection.sets.filter(s => s !== setName);

    // Reassign photos in this set to 'Highlights'
    collection.photos.forEach(photo => {
      if (photo.set === setName) {
        photo.set = 'Highlights';
      }
    });

    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
