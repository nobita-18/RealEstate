const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbFiles = {
  users: path.join(__dirname, 'database', 'users.json'),
  properties: path.join(__dirname, 'database', 'properties.json'),
  enquiries: path.join(__dirname, 'database', 'enquiries.json'),
  logs: path.join(__dirname, 'database', 'logs.json')
};

// Read databases
const users = JSON.parse(fs.readFileSync(dbFiles.users, 'utf8'));
const properties = JSON.parse(fs.readFileSync(dbFiles.properties, 'utf8'));
const enquiries = JSON.parse(fs.readFileSync(dbFiles.enquiries, 'utf8'));
const logs = JSON.parse(fs.readFileSync(dbFiles.logs, 'utf8'));

// Determine next IDs
const sellers = users.filter(u => u.role === 'seller');
let nextSelNum = 1;
if (sellers.length > 0) {
  const ids = sellers.map(s => {
    const match = String(s.id).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  nextSelNum = Math.max(...ids) + 1;
}
const newSellerId = `SEL${String(nextSelNum).padStart(4, '0')}`;

const buyers = users.filter(u => u.role === 'buyer' || !u.role);
let nextBuyNum = 1;
if (buyers.length > 0) {
  const ids = buyers.map(b => {
    const match = String(b.id).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  nextBuyNum = Math.max(...ids) + 1;
}
const newBuyerId = `BUY${String(nextBuyNum).padStart(4, '0')}`;

const admins = users.filter(u => u.role === 'admin');
let nextAdmNum = 1;
if (admins.length > 0) {
  const ids = admins.map(a => {
    const match = String(a.id).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  nextAdmNum = Math.max(...ids) + 1;
}
const newAdminId = `ADM${String(nextAdmNum).padStart(4, '0')}`;

// Hash password
const passwordHash = bcrypt.hashSync('password123', 10);

const newSeller = {
  id: newSellerId,
  name: "Tamil Seller",
  username: "tamil_seller",
  email: "seller@test.com",
  password: passwordHash,
  role: "seller",
  mobile: "9876543212",
  photo: null,
  kycDocument: null,
  theme: "blue",
  plainPassword: "password123",
  status: "active",
  memberSince: "27-06-2026",
  notifications: []
};

const newBuyer = {
  id: newBuyerId,
  name: "Tamil Buyer",
  username: "tamil_buyer",
  email: "buyer@test.com",
  password: passwordHash,
  role: "buyer",
  mobile: "9876543213",
  photo: null,
  kycDocument: null,
  theme: "blue",
  plainPassword: "password123",
  status: "active",
  memberSince: "27-06-2026",
  favorites: [],
  notifications: []
};

const newAdmin = {
  id: newAdminId,
  name: "Tamil Admin",
  username: "tamil_admin",
  email: "admin@test.com",
  password: passwordHash,
  role: "admin",
  mobile: "9876543214",
  status: "active",
  memberSince: "27-06-2026",
  notifications: []
};

// Check duplicates
if (!users.some(u => u.email === newSeller.email || u.username === newSeller.username)) {
  users.push(newSeller);
}
if (!users.some(u => u.email === newBuyer.email || u.username === newBuyer.username)) {
  users.push(newBuyer);
}
if (!users.some(u => u.email === newAdmin.email || u.username === newAdmin.username)) {
  users.push(newAdmin);
}

// Next property ID
let nextPropId = 1;
if (properties.length > 0) {
  nextPropId = Math.max(...properties.map(p => p.id)) + 1;
}

const newProperties = [
  {
    id: nextPropId,
    status: "approved",
    createdAt: new Date().toISOString(),
    title: "Cozy House in Thoothukudi",
    description: "A beautiful house in Thoothukudi with all modern amenities.",
    price: 4500000,
    address: "123 Kovil Street",
    city: "Thoothukudi",
    state: "Tamil Nadu",
    pincode: "628001",
    mobile: "9876543212",
    email: "seller@test.com",
    propertyType: "House",
    bedrooms: 2,
    bathrooms: 2,
    builtupArea: 1200,
    parkingSpaces: 1,
    ownerId: newSellerId,
    location: "123 Kovil Street, Thoothukudi, Tamil Nadu 628001",
    images: ["/uploads/properties/fallback-1.jpg"],
    views: 100,
    area: 1200,
    inquiries: [],
    reviews: []
  },
  {
    id: nextPropId + 1,
    status: "approved",
    createdAt: new Date().toISOString(),
    title: "Luxury Villa in Tirunelveli",
    description: "Spacious luxury villa in the heart of Tirunelveli.",
    price: 8500000,
    address: "456 Bypass Road",
    city: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627001",
    mobile: "9876543212",
    email: "seller@test.com",
    propertyType: "Villa",
    bedrooms: 3,
    bathrooms: 3,
    builtupArea: 2500,
    parkingSpaces: 2,
    ownerId: newSellerId,
    location: "456 Bypass Road, Tirunelveli, Tamil Nadu 627001",
    images: ["/uploads/properties/fallback-1.jpg"],
    views: 150,
    area: 2500,
    inquiries: [],
    reviews: []
  },
  {
    id: nextPropId + 2,
    status: "approved",
    createdAt: new Date().toISOString(),
    title: "Beachside PG in Tiruchendur",
    description: "Comfortable and affordable PG accommodation near the temple and beach.",
    price: 6000,
    address: "789 Temple View Street",
    city: "Tiruchendur",
    state: "Tamil Nadu",
    pincode: "628215",
    mobile: "9876543212",
    email: "seller@test.com",
    propertyType: "PG",
    pgType: "Boys",
    sharingType: "2 Sharing",
    numberOfBeds: 2,
    availableRooms: 4,
    securityDeposit: 5000,
    ownerId: newSellerId,
    location: "789 Temple View Street, Tiruchendur, Tamil Nadu 628215",
    images: ["/uploads/properties/fallback-1.jpg"],
    views: 80,
    area: 400,
    inquiries: [],
    reviews: []
  },
  {
    id: nextPropId + 3,
    status: "approved",
    createdAt: new Date().toISOString(),
    title: "Commercial Land in Madurai",
    description: "Prime location commercial plot for sale in Madurai.",
    price: 12000000,
    address: "12 Ring Road",
    city: "Madurai",
    state: "Tamil Nadu",
    pincode: "625001",
    mobile: "9876543212",
    email: "seller@test.com",
    propertyType: "Land",
    landArea: 4800,
    ownerId: newSellerId,
    location: "12 Ring Road, Madurai, Tamil Nadu 625001",
    images: ["/uploads/properties/fallback-1.jpg"],
    views: 60,
    area: 4800,
    inquiries: [],
    reviews: []
  },
  {
    id: nextPropId + 4,
    status: "approved",
    createdAt: new Date().toISOString(),
    title: "Modern Penthouse in Coimbatore",
    description: "High-end luxury penthouse with panoramic city views in Coimbatore.",
    price: 15000000,
    address: "88 Avinashi Road",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
    mobile: "9876543212",
    email: "seller@test.com",
    propertyType: "Penthouse",
    bedrooms: 4,
    bathrooms: 4,
    builtupArea: 3500,
    ownerId: newSellerId,
    location: "88 Avinashi Road, Coimbatore, Tamil Nadu 641001",
    images: ["/uploads/properties/fallback-1.jpg"],
    views: 200,
    area: 3500,
    inquiries: [],
    reviews: []
  }
];

// Add properties & enquiries
let nextEnqId = enquiries.length > 0 ? Math.max(...enquiries.map(e => e.id)) + 1 : 1;

newProperties.forEach(prop => {
  const newEnq = {
    id: nextEnqId++,
    date: new Date().toISOString(),
    userId: newBuyerId,
    userName: "Tamil Buyer",
    userEmail: "buyer@test.com",
    userMobile: "9876543213",
    propertyId: prop.id,
    propertyTitle: prop.title,
    message: `I am interested in ${prop.title}. Please share more details.`
  };
  
  enquiries.push(newEnq);
  prop.inquiries.push(newEnq);
  properties.push(prop);
  
  // Add Approval Log
  logs.push({
    id: Date.now() + Math.random(),
    type: "APPROVAL",
    message: `Property "${prop.title}" (ID: HF${prop.id}) has been APPROVED by admin ${newAdminId}.`,
    details: {
      propertyId: prop.id,
      propertyTitle: prop.title,
      adminId: newAdminId,
      adminName: "Tamil Admin"
    },
    timestamp: new Date().toISOString()
  });
});

// Save databases
fs.writeFileSync(dbFiles.users, JSON.stringify(users, null, 2));
fs.writeFileSync(dbFiles.properties, JSON.stringify(properties, null, 2));
fs.writeFileSync(dbFiles.enquiries, JSON.stringify(enquiries, null, 2));
fs.writeFileSync(dbFiles.logs, JSON.stringify(logs, null, 2));

console.log("Seeding completed successfully!");
console.log(`Seller: ${newSeller.email} / password123`);
console.log(`Buyer: ${newBuyer.email} / password123`);
console.log(`Admin: ${newAdmin.email} / password123`);
