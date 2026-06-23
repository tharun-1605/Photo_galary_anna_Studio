const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const Collection = require('../models/Collection');
const Favorite = require('../models/Favorite');
const Activity = require('../models/Activity');

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

// @desc    Get all public collections
// @route   GET /api/public/collections
// @access  Public
router.get('/collections', async (req, res) => {
  try {
    const collections = await Collection.find({ 'settings.status': 'Published' })
      .select('name slug eventDate coverPhoto settings.design')
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @desc    Get public collection by slug
// @route   GET /api/public/collections/:slug
// @access  Public
router.get('/collections/:slug', async (req, res) => {
  const { password } = req.query;

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if collection is hidden/draft
    if (collection.settings.status !== 'Published' && collection.settings.status !== 'Hidden') {
      return res.status(403).json({ message: 'This collection is not public' });
    }

    // Check password protection
    if (collection.settings.password) {
      if (!password || password !== collection.settings.password) {
        // Return limited metadata only
        return res.json({
          _id: collection._id,
          name: collection.name,
          slug: collection.slug,
          eventDate: collection.eventDate,
          coverPhoto: collection.coverPhoto,
          needsPassword: true,
          settings: {
            design: collection.settings.design
          }
        });
      }
    }

    // Return full details (exclude the actual password field for safety)
    const galleryData = collection.toObject();
    if (galleryData.settings) {
      delete galleryData.settings.password;
    }

    res.json({
      ...galleryData,
      needsPassword: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify collection password
// @route   POST /api/public/collections/:slug/unlock
// @access  Public
router.post('/collections/:slug/unlock', async (req, res) => {
  const { password } = req.body;

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.settings.password === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Log public client activity
// @route   POST /api/public/collections/:slug/activity
// @access  Public
router.post('/collections/:slug/activity', async (req, res) => {
  const { email, actionType, details } = req.body;

  if (!email || !actionType) {
    return res.status(400).json({ message: 'Email and actionType are required' });
  }

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const activity = await Activity.create({
      collectionId: collection._id,
      collectionName: collection.name,
      clientEmail: email,
      actionType,
      details: details || ''
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get or create client favorites list
// @route   GET /api/public/collections/:slug/favorites
// @access  Public
router.get('/collections/:slug/favorites', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    let favorite = await Favorite.findOne({
      collectionId: collection._id,
      clientEmail: email.toLowerCase()
    });

    if (!favorite) {
      favorite = await Favorite.create({
        collectionId: collection._id,
        clientEmail: email.toLowerCase(),
        photoUrls: []
      });
    }

    res.json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle a photo in client favorites
// @route   POST /api/public/collections/:slug/favorites/toggle
// @access  Public
router.post('/collections/:slug/favorites/toggle', async (req, res) => {
  const { email, photoUrl } = req.body;

  if (!email || !photoUrl) {
    return res.status(400).json({ message: 'Email and photoUrl are required' });
  }

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    let favorite = await Favorite.findOne({
      collectionId: collection._id,
      clientEmail: email.toLowerCase()
    });

    if (!favorite) {
      favorite = new Favorite({
        collectionId: collection._id,
        clientEmail: email.toLowerCase(),
        photoUrls: []
      });
    }

    const exists = favorite.photoUrls.includes(photoUrl);
    let action = '';

    if (exists) {
      favorite.photoUrls = favorite.photoUrls.filter(url => url !== photoUrl);
      action = 'Unfavorite Photo';
    } else {
      favorite.photoUrls.push(photoUrl);
      action = 'Favorite Photo';
    }

    await favorite.save();

    // Log Activity
    await Activity.create({
      collectionId: collection._id,
      collectionName: collection.name,
      clientEmail: email,
      actionType: action,
      details: `Photo: ${path.basename(photoUrl)}`
    });

    res.json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download single photo (with PIN check if configured)
// @route   GET /api/public/collections/:slug/download-photo
// @access  Public
router.get('/collections/:slug/download-photo', async (req, res) => {
  const { email, pin, photoUrl } = req.query;

  if (!email || !photoUrl) {
    return res.status(400).json({ message: 'Email and photoUrl are required' });
  }

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Verify PIN if configured
    if (collection.settings.downloads.enabled && collection.settings.downloads.pin) {
      if (!pin || pin !== collection.settings.downloads.pin) {
        return res.status(401).json({ message: 'Invalid Download PIN' });
      }
    }

    const filePath = path.join(__dirname, '..', photoUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Photo file not found on server' });
    }

    // Log Activity
    await Activity.create({
      collectionId: collection._id,
      collectionName: collection.name,
      clientEmail: email,
      actionType: 'Download Photo',
      details: `Photo: ${path.basename(photoUrl)}`
    });

    res.download(filePath, path.basename(filePath));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download full gallery as ZIP
// @route   GET /api/public/collections/:slug/download-zip
// @access  Public
router.get('/collections/:slug/download-zip', async (req, res) => {
  const { email, pin, onlyFavorites } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const collection = await Collection.findOne({ slug: req.params.slug });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Verify PIN if configured
    if (collection.settings.downloads.enabled && collection.settings.downloads.pin) {
      if (!pin || pin !== collection.settings.downloads.pin) {
        return res.status(401).json({ message: 'Invalid Download PIN' });
      }
    }

    let photosToZip = [];

    if (onlyFavorites === 'true') {
      const favorite = await Favorite.findOne({
        collectionId: collection._id,
        clientEmail: email.toLowerCase()
      });

      if (!favorite || favorite.photoUrls.length === 0) {
        return res.status(400).json({ message: 'No favorites found to download' });
      }
      photosToZip = collection.photos.filter(p => favorite.photoUrls.includes(p.url));
    } else {
      photosToZip = collection.photos;
    }

    if (photosToZip.length === 0) {
      return res.status(400).json({ message: 'No photos to download' });
    }

    // Log Activity
    await Activity.create({
      collectionId: collection._id,
      collectionName: collection.name,
      clientEmail: email,
      actionType: 'Download Gallery',
      details: onlyFavorites === 'true' ? 'Favorites list' : 'Full gallery'
    });

    // Set headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${slugify(collection.name)}-photos.zip`);

    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    archive.on('error', function (err) {
      throw err;
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    photosToZip.forEach(photo => {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: photo.filename });
      }
    });

    // Finalize the ZIP
    await archive.finalize();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
});

module.exports = router;
