const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Collection = require('./models/Collection');
const Activity = require('./models/Activity');
const Favorite = require('./models/Favorite');

const MONGO_URI = 'mongodb://127.0.0.1:27017/pixieset_clone';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear previous data
    console.log('Clearing old documents...');
    await User.deleteMany({});
    await Collection.deleteMany({});
    await Activity.deleteMany({});
    await Favorite.deleteMany({});

    // 1. Create photographer admin
    console.log('Creating admin photographer...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = new User({
      email: 'photographer@example.com',
      password: hashedPassword,
      studioName: 'Anna Studio'
    });
    await admin.save();
    console.log('Admin photographer created (Email: photographer@example.com, Password: password123)');

    // 2. Create sample collection
    console.log('Creating sample collection...');
    const sampleCollection = new Collection({
      name: 'Emma & Daniel Wedding',
      slug: 'emma-daniel',
      eventDate: new Date('2026-06-20'),
      coverPhoto: '/uploads/wedding_couple.png',
      sets: ['Highlights', 'Ceremony', 'Reception'],
      photos: [
        {
          url: '/uploads/wedding_couple.png',
          filename: 'wedding_couple.png',
          set: 'Highlights',
          size: 145000
        },
        {
          url: '/uploads/ceremony_setup.png',
          filename: 'ceremony_setup.png',
          set: 'Ceremony',
          size: 198000
        },
        {
          url: '/uploads/reception_decor.png',
          filename: 'reception_decor.png',
          set: 'Reception',
          size: 210000
        }
      ],
      settings: {
        status: 'Published',
        password: '',
        downloads: {
          enabled: true,
          pin: '1234',
          sizes: ['Web Size', 'High Res', 'Original'],
          requireEmail: true
        },
        favorites: {
          enabled: true
        },
        socialSharing: {
          enabled: true
        },
        design: {
          coverStyle: 'Full Screen',
          typography: 'Modern',
          colorPalette: 'Warm',
          gridSpacing: 'Normal'
        }
      }
    });

    await sampleCollection.save();
    console.log('Sample collection created successfully (Slug: emma-daniel)');

    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
