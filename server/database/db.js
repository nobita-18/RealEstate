const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Override DNS servers to Google and Cloudflare DNS to avoid querySrv ECONNREFUSED errors
// This is only applied locally, as Render blocks outbound custom DNS queries (Port 53)
if (dns.setServers && !process.env.RENDER) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('Failed to set custom DNS servers:', err.message);
  }
}

const { User, Property, Enquiry, Booking, Log } = require('./models');

// Load environment variables if they are not loaded yet
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/real-estate-platform';

const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB: ${MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB Connected successfully!');
    
    // Run migration
    try {
      console.log('Dropping legacy unique indexes to prevent write failures...');
      await mongoose.connection.db.collection('users').dropIndexes();
      console.log('Successfully cleared users indexes.');
    } catch (e) {
      console.log('Skipping users index drop (no legacy unique indexes to clear).');
    }
    try {
      await mongoose.connection.db.collection('properties').dropIndexes();
      console.log('Successfully cleared properties indexes.');
    } catch (e) {
      console.log('Skipping properties index drop (no legacy unique indexes to clear).');
    }

    await migrateJSONToMongoDB();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Backend will fall back to using local JSON files.');
    throw err;
  }
};

const migrateJSONToMongoDB = async () => {
  const jsonFiles = {
    users: path.join(__dirname, 'users.json'),
    properties: path.join(__dirname, 'properties.json'),
    enquiries: path.join(__dirname, 'enquiries.json'),
    bookings: path.join(__dirname, 'bookings.json'),
    logs: path.join(__dirname, 'logs.json')
  };

  try {
    // 1. Migrate Users
    if (fs.existsSync(jsonFiles.users)) {
      const count = await User.countDocuments();
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync(jsonFiles.users, 'utf8'));
        if (data.length > 0) {
          const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
          await User.deleteMany({});
          await User.insertMany(uniqueData);
          console.log(`Initialized MongoDB with ${uniqueData.length} default users.`);
        }
      } else {
        console.log('MongoDB already has users. Skipping user initialization.');
      }
    }

    // 2. Migrate Properties
    if (fs.existsSync(jsonFiles.properties)) {
      const count = await Property.countDocuments();
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync(jsonFiles.properties, 'utf8'));
        if (data.length > 0) {
          const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
          await Property.deleteMany({});
          await Property.insertMany(uniqueData);
          console.log(`Initialized MongoDB with ${uniqueData.length} default properties.`);
        }
      } else {
        console.log('MongoDB already has properties. Skipping properties initialization.');
      }
    }

    // 3. Migrate Enquiries
    if (fs.existsSync(jsonFiles.enquiries)) {
      const count = await Enquiry.countDocuments();
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync(jsonFiles.enquiries, 'utf8'));
        if (data.length > 0) {
          const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
          await Enquiry.deleteMany({});
          await Enquiry.insertMany(uniqueData);
          console.log(`Initialized MongoDB with ${uniqueData.length} default enquiries.`);
        }
      } else {
        console.log('MongoDB already has enquiries. Skipping enquiries initialization.');
      }
    }

    // 4. Migrate Bookings
    if (fs.existsSync(jsonFiles.bookings)) {
      const count = await Booking.countDocuments();
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync(jsonFiles.bookings, 'utf8'));
        if (data.length > 0) {
          const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
          await Booking.deleteMany({});
          await Booking.insertMany(uniqueData);
          console.log(`Initialized MongoDB with ${uniqueData.length} default bookings.`);
        }
      } else {
        console.log('MongoDB already has bookings. Skipping bookings initialization.');
      }
    }

    // 5. Migrate Logs
    if (fs.existsSync(jsonFiles.logs)) {
      const count = await Log.countDocuments();
      if (count === 0) {
        const data = JSON.parse(fs.readFileSync(jsonFiles.logs, 'utf8'));
        if (data.length > 0) {
          await Log.deleteMany({});
          await Log.insertMany(data);
          console.log(`Initialized MongoDB with ${data.length} default logs.`);
        }
      } else {
        console.log('MongoDB already has logs. Skipping logs initialization.');
      }
    }

    console.log('Database initialization completed.');
  } catch (err) {
    console.error('Error during data synchronization:', err);
  }
};

module.exports = {
  connectDB,
  isMongoDBActive: () => mongoose.connection.readyState === 1
};
