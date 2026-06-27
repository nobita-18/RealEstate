const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  role: { type: String, default: 'buyer' },
  mobile: { type: String, default: '' },
  photo: { type: String, default: null },
  kycDocument: { type: String, default: null },
  theme: { type: String, default: 'blue' },
  plainPassword: { type: String, default: '' },
  status: { type: String, default: 'active' },
  memberSince: { type: String, default: '' },
  favorites: { type: Array, default: [] },
  notifications: { type: Array, default: [] },
  rating: { type: Number, default: 0 },
  lastLogin: { type: String, default: '' }
}, { timestamps: true });

// Property Schema
const PropertySchema = new Schema({
  id: { type: Number, required: true, unique: true },
  status: { type: String, default: 'pending' },
  statusReason: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: 'Tamil Nadu' },
  pincode: { type: String, default: '' },
  mobile: { type: String, default: '' },
  email: { type: String, default: '' },
  propertyType: { type: String, default: '' },
  bedrooms: { type: Schema.Types.Mixed, default: '' },
  bathrooms: { type: Schema.Types.Mixed, default: '' },
  builtupArea: { type: Schema.Types.Mixed, default: '' },
  floorNumber: { type: String, default: '' },
  terraceArea: { type: String, default: '' },
  landArea: { type: Schema.Types.Mixed, default: '' },
  parkingSpaces: { type: Schema.Types.Mixed, default: '' },
  pgName: { type: String, default: '' },
  monthlyRent: { type: Schema.Types.Mixed, default: '' },
  securityDeposit: { type: Schema.Types.Mixed, default: '' },
  pgType: { type: String, default: '' },
  sharingType: { type: String, default: '' },
  numberOfBeds: { type: String, default: '' },
  availableRooms: { type: String, default: '' },
  foodAvailable: { type: Boolean, default: false },
  plotNumber: { type: String, default: '' },
  surveyNumber: { type: String, default: '' },
  ownerId: { type: Schema.Types.Mixed, required: true },
  location: { type: String, default: '' },
  images: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  inquiries: { type: Array, default: [] },
  reviews: { type: Array, default: [] },
  area: { type: Number, default: 0 }
}, { timestamps: true });

// Enquiry Schema
const EnquirySchema = new Schema({
  id: { type: Number, required: true, unique: true },
  date: { type: String, default: () => new Date().toISOString() },
  userId: { type: Schema.Types.Mixed, required: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  userMobile: { type: String, default: '' },
  propertyId: { type: Number, required: true },
  propertyTitle: { type: String, default: '' },
  message: { type: String, default: '' }
}, { timestamps: true });

// Booking Schema
const BookingSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  date: { type: String, default: () => new Date().toISOString() },
  propertyId: { type: Number, required: true },
  propertyTitle: { type: String, default: '' },
  buyerId: { type: Schema.Types.Mixed, required: true },
  buyerName: { type: String, default: '' },
  price: { type: Number, default: 0 },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

// Log Schema
const LogSchema = new Schema({
  id: { type: Schema.Types.Mixed, required: true },
  type: { type: String, default: '' },
  message: { type: String, default: '' },
  details: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Property: mongoose.model('Property', PropertySchema),
  Enquiry: mongoose.model('Enquiry', EnquirySchema),
  Booking: mongoose.model('Booking', BookingSchema),
  Log: mongoose.model('Log', LogSchema)
};
