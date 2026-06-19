const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Collection = require('../models/Collection');
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/auth');

// @desc    Get all activities (sorted by date)
// @route   GET /api/activity
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get activities for a specific collection
// @route   GET /api/activity/collections/:id
// @access  Private
router.get('/collections/:id', protect, async (req, res) => {
  try {
    const activities = await Activity.find({ collectionId: req.params.id }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get statistics summary
// @route   GET /api/activity/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const totalCollections = await Collection.countDocuments({});
    
    // Total photos count across all collections
    const collections = await Collection.find({});
    let totalPhotos = 0;
    collections.forEach(col => {
      totalPhotos += col.photos.length;
    });

    const totalEnterGallery = await Activity.countDocuments({ actionType: 'Enter Gallery' });
    const totalDownloads = await Activity.countDocuments({ 
      actionType: { $in: ['Download Photo', 'Download Gallery'] } 
    });
    const totalFavorites = await Activity.countDocuments({ actionType: 'Favorite Photo' });

    // Recent activity logs
    const recentActivities = await Activity.find({}).sort({ createdAt: -1 }).limit(10);

    // Group favorites by client email to see lists
    const favorites = await Favorite.find({}).populate('collectionId', 'name');

    res.json({
      summary: {
        totalCollections,
        totalPhotos,
        totalEnterGallery,
        totalDownloads,
        totalFavorites
      },
      recentActivities,
      favorites
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
