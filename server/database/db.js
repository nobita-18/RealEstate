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
    const userCount = await User.countDocuments();
    if (userCount === 0 && fs.existsSync(jsonFiles.users)) {
      const data = JSON.parse(fs.readFileSync(jsonFiles.users, 'utf8'));
      if (data.length > 0) {
        // Remove duplicates by ID to be safe
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await User.insertMany(uniqueData);
        console.log(`Migrated ${uniqueData.length} users to MongoDB.`);
      }
    }

    // 2. Migrate Properties
    const propertyCount = await Property.countDocuments();
    if (propertyCount === 0 && fs.existsSync(jsonFiles.properties)) {
      const data = JSON.parse(fs.readFileSync(jsonFiles.properties, 'utf8'));
      if (data.length > 0) {
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await Property.insertMany(uniqueData);
        console.log(`Migrated ${uniqueData.length} properties to MongoDB.`);
      }
    }

    // 3. Migrate Enquiries
    const enquiryCount = await Enquiry.countDocuments();
    if (enquiryCount === 0 && fs.existsSync(jsonFiles.enquiries)) {
      const data = JSON.parse(fs.readFileSync(jsonFiles.enquiries, 'utf8'));
      if (data.length > 0) {
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await Enquiry.insertMany(uniqueData);
        console.log(`Migrated ${uniqueData.length} enquiries to MongoDB.`);
      }
    }

    // 4. Migrate Bookings
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0 && fs.existsSync(jsonFiles.bookings)) {
      const data = JSON.parse(fs.readFileSync(jsonFiles.bookings, 'utf8'));
      if (data.length > 0) {
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        await Booking.insertMany(uniqueData);
        console.log(`Migrated ${uniqueData.length} bookings to MongoDB.`);
      }
    }

    // 5. Migrate Logs
    const logCount = await Log.countDocuments();
    if (logCount === 0 && fs.existsSync(jsonFiles.logs)) {
      const data = JSON.parse(fs.readFileSync(jsonFiles.logs, 'utf8'));
      if (data.length > 0) {
        // Logs might not have unique ID constraint, but we store it as is
        await Log.insertMany(data);
        console.log(`Migrated ${data.length} logs to MongoDB.`);
      }
    }

    console.log('Database migration check completed.');
  } catch (err) {
    console.error('Error during data migration:', err);
  }
};

module.exports = {
  connectDB,
  isMongoDBActive: () => mongoose.connection.readyState === 1
};
