const express = require('express');
const { connectDB, isMongoDBActive } = require('./database/db');
const { User, Property, Enquiry, Booking, Log } = require('./database/models');

const getModel = (key) => {
  switch (key) {
    case 'users': return User;
    case 'properties': return Property;
    case 'enquiries': return Enquiry;
    case 'bookings': return Booking;
    case 'logs': return Log;
    default: return null;
  }
};

const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = 'your_super_secret_jwt_key_here';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure directories exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static serve for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Utility
const dbFiles = {
  users: path.join(__dirname, 'database', 'users.json'),
  properties: path.join(__dirname, 'database', 'properties.json'),
  enquiries: path.join(__dirname, 'database', 'enquiries.json'),
  bookings: path.join(__dirname, 'database', 'bookings.json'),
  logs: path.join(__dirname, 'database', 'logs.json')
};

// Initialize DB files if not exist
if (!fs.existsSync(dbFiles.enquiries)) fs.writeFileSync(dbFiles.enquiries, '[]');
if (!fs.existsSync(dbFiles.bookings)) fs.writeFileSync(dbFiles.bookings, '[]');
if (!fs.existsSync(dbFiles.logs)) fs.writeFileSync(dbFiles.logs, '[]');

const readDb = async (key) => {
  try {
    if (isMongoDBActive()) {
      const Model = getModel(key);
      if (Model) {
        return await Model.find({}).lean();
      }
    }
  } catch (err) {
    console.error('MongoDB read error, falling back to JSON:', err.message);
  }
  return JSON.parse(fs.readFileSync(dbFiles[key], 'utf8'));
};
const writeDb = async (key, data) => {
  try {
    if (isMongoDBActive()) {
      const Model = getModel(key);
      if (Model) {
        await Model.deleteMany({});
        if (data && data.length > 0) {
          await Model.insertMany(data);
        }
        return;
      }
    }
  } catch (err) {
    console.error('MongoDB write error, falling back to JSON:', err.message);
  }
  fs.writeFileSync(dbFiles[key], JSON.stringify(data, null, 2));
};

const logEvent = async (type, message, details = {}) => {
  try {
    const logs = await readDb('logs');
    logs.push({
      id: Date.now() + Math.random(),
      type, // 'LOGIN', 'REGISTRATION', 'DELETION'
      message,
      details,
      timestamp: new Date().toISOString()
    });
    if (logs.length > 100) logs.shift();
    await writeDb('logs', logs);
  } catch (err) {
    console.error('Failed to log event:', err);
  }
};

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') {
      cb(null, path.join(__dirname, 'uploads', 'properties'));
    } else if (file.fieldname === 'photo' || file.fieldname === 'kycDocument' || req.path.includes('register')) {
      cb(null, path.join(__dirname, 'uploads', 'profiles'));
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });


// ------- AUTH ROUTES -------
app.post('/api/auth/register', upload.any(), async (req, res) => {
  const users = await readDb('users');
  const { name, username, email, password, plainPassword, role, mobile } = req.body;
  
  if (users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: 'Email already registered.' });
  }
  if (users.some(u => u.mobile === mobile)) {
    return res.status(400).json({ message: 'Mobile Number already registered.' });
  }

  let photoPath = null;
  const file = req.files && req.files[0];
  if (file) {
    photoPath = `/uploads/profiles/${file.filename}`;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate Auto-Incrementing Prefix ID
  let customId;
  if (role === 'seller') {
    const sellers = users.filter(u => u.role === 'seller');
    let nextSelNum = 1;
    if (sellers.length > 0) {
      const ids = sellers.map(s => {
        const match = String(s.id).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextSelNum = Math.max(...ids) + 1;
    }
    customId = `SEL${String(nextSelNum).padStart(4, '0')}`;
  } else {
    const buyers = users.filter(u => u.role === 'buyer' || !u.role);
    let nextBuyNum = 1;
    if (buyers.length > 0) {
      const ids = buyers.map(b => {
        const match = String(b.id).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      nextBuyNum = Math.max(...ids) + 1;
    }
    customId = `BUY${String(nextBuyNum).padStart(4, '0')}`;
  }

  // Format Date: DD-MM-YYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const memberSince = `${day}-${month}-${year}`;

  const newUser = {
    id: customId,
    name,
    username: username || name,
    email,
    password: hashedPassword,
    role: role || 'buyer',
    mobile,
    photo: photoPath,
    kycDocument: photoPath,
    theme: req.body.theme || 'blue',
    plainPassword: plainPassword || password,
    status: 'active',
    memberSince,
    // Address information
    address: req.body.address || null,
    city: req.body.city || null,
    state: req.body.state || null,
    pincode: req.body.pincode || null,
    // Seller specific business details
    companyName: req.body.companyName || null,
    sellerType: req.body.sellerType || null,
    // Seller verification details
    panNumber: req.body.panNumber || null,
    aadhaarNumber: req.body.aadhaarNumber || null,
    gstNumber: req.body.gstNumber || null,
    favorites: [],
    notifications: [],
    rating: 0
  };
  
  users.push(newUser);
  await writeDb('users', users);
  await logEvent('REGISTRATION', `New ${newUser.role} user ${newUser.id} (${newUser.name}) registered.`, { userId: newUser.id, name: newUser.name, role: newUser.role });
  
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: newUser });
});

app.post('/api/auth/login', async (req, res) => {
  const users = await readDb('users');
  const { identifier, password } = req.body;
  const user = users.find(u => (
    (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
    (u.username && u.username.toLowerCase() === identifier.toLowerCase()) ||
    (u.mobile === identifier) ||
    (u.id && String(u.id).toLowerCase() === identifier.toLowerCase())
  ));
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.status === 'deactivated') {
    return res.status(403).json({ message: 'Account is deactivated. Access denied.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    if (user.password === password) {
       // Proceed for plaintext fallbacks
    } else {
       return res.status(401).json({ message: 'Invalid credentials' });
    }
  }

  // Format Date/Time: DD-MM-YYYY HH:MM AM/PM
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = String(hours).padStart(2, '0');
  const lastLoginStr = `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
  user.lastLogin = lastLoginStr;

  await writeDb('users', users);
  await logEvent('LOGIN', `User ${user.id} (${user.name}) logged in.`, { userId: user.id, name: user.name, role: user.role });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

app.put('/api/users/:id/status', async (req, res) => {
  const users = await readDb('users');
  const userIndex = users.findIndex(u => String(u.id) === String(req.params.id));
  if (userIndex !== -1) {
    users[userIndex].status = req.body.status;
    await writeDb('users', users);
    await logEvent('USER_STATUS_CHANGE', `User ${users[userIndex].id} (${users[userIndex].name}) status changed to ${req.body.status}.`, { userId: users[userIndex].id, status: req.body.status });
    res.json(users[userIndex]);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});



// ------- PROPERTY ROUTES -------
app.get('/api/properties', async (req, res) => {
  let props = await readDb('properties');

  if (req.query.status === 'pending') {
    props = props.filter(p => p.status === 'pending');
  } else if (req.query.status === 'all') {
    // Return everything for Admin
  } else {
    // Normal users ONLY see approved properties or grandfathered ones
    props = props.filter(p => !p.status || p.status === 'approved');
  }

  res.json(props);
});

app.get('/api/properties/:id', async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  if (propIndex !== -1) {
    const prop = props[propIndex];
    if (prop.status === 'deleted' && req.query.preview !== 'pending' && req.query.status !== 'all') {
      return res.status(404).json({ message: 'Property not found' });
    }
    props[propIndex].views = (props[propIndex].views || 0) + 1;
    await writeDb('properties', props);
    
    let responseData = { ...props[propIndex] };
    if (req.query.preview === 'pending' && responseData.hasPendingChanges && responseData.pendingChanges) {
      responseData = { ...responseData, ...responseData.pendingChanges };
    }
    res.json(responseData);
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

app.post('/api/properties', upload.array('images', 10), async (req, res) => {
  const props = await readDb('properties');
  if (req.files && req.files.length < 2) {
    return res.status(400).json({ message: 'Must upload at least 2 images.' });
  }
  const imagePaths = req.files ? req.files.map(f => `/uploads/properties/${f.filename}`) : [];
  
  const newProp = {
    id: props.length ? Math.max(...props.map(p => p.id)) + 1 : 1,
    status: 'pending', // Awaiting Admin Approval
    createdAt: new Date().toISOString(),
    ...req.body,
    images: req.body.existingImages ? req.body.existingImages : imagePaths,
    views: 0 // Initialize newly added property views to 0
  };
  props.push(newProp);
  await writeDb('properties', props);

  // NOTIFICATION LOGIC
  const users = await readDb('users');
  let usersUpdated = false;
  if (newProp.ownerId) {
    users.forEach(u => {
      if (u.favorites && u.favorites.length > 0) {
        // check if user favorited a property by this owner
        const hasFavoriteByOwner = u.favorites.some(favId => {
          const favProp = props.find(p => p.id === favId);
          return favProp && String(favProp.ownerId) === String(newProp.ownerId);
        });
        if (hasFavoriteByOwner) {
          u.notifications = u.notifications || [];
          u.notifications.push({
            id: Date.now() + Math.random(),
            message: 'New property added by a seller you follow (via favorites)!',
            propertyId: newProp.id,
            read: false,
            date: new Date().toISOString()
          });
          usersUpdated = true;
        }
      }
    });
    if (usersUpdated) await writeDb('users', users);
  }

  res.status(201).json(newProp);
});

// Admin Put Route for Status
app.put('/api/properties/:id/status', async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  if (propIndex !== -1) {
    const { status, reason } = req.body;
    const prop = props[propIndex];
    const hadPendingChanges = !!prop.hasPendingChanges;

    if (prop.status === 'pending_delete') {
      if (status === 'approved') {
        // Deletion approved -> Mark status as deleted for audit log
        prop.status = 'deleted';
        await writeDb('properties', props);
        await logEvent('DELETION', `Property HF${prop.id} ("${prop.title}") deletion approved. Reason: ${reason || 'No reason provided'}`, { propertyId: prop.id, title: prop.title, ownerId: prop.ownerId });

        // Notify seller
        if (prop.ownerId) {
          const users = await readDb('users');
          const userIndex = users.findIndex(u => String(u.id) === String(prop.ownerId));
          if (userIndex !== -1) {
            users[userIndex].notifications = users[userIndex].notifications || [];
            users[userIndex].notifications.push({
              id: Date.now() + Math.random(),
              message: `Your deletion request for property "${prop.title || 'Untitled'}" (ID: HF${prop.id}) has been APPROVED. The property has been deleted.`,
              reason: reason || 'No reason provided',
              date: new Date().toISOString(),
              read: false
            });
            await writeDb('users', users);
          }
        }
        return res.json(prop);
      } else if (status === 'rejected') {
        // Deletion rejected -> Restore to approved
        prop.status = 'approved';
        delete prop.deleteReason;
        await writeDb('properties', props);

        // Notify seller
        if (prop.ownerId) {
          const users = await readDb('users');
          const userIndex = users.findIndex(u => String(u.id) === String(prop.ownerId));
          if (userIndex !== -1) {
            users[userIndex].notifications = users[userIndex].notifications || [];
            users[userIndex].notifications.push({
              id: Date.now() + Math.random(),
              message: `Your deletion request for property "${prop.title || 'Untitled'}" (ID: HF${prop.id}) has been REJECTED. The property remains listed.`,
              reason: reason || 'No reason provided',
              date: new Date().toISOString(),
              read: false
            });
            await writeDb('users', users);
          }
        }
        return res.json(prop);
      }
    }

    if (prop.hasPendingChanges) {
      if (status === 'approved') {
        // Merge changes
        Object.assign(prop, prop.pendingChanges);
        prop.status = 'approved';
        delete prop.pendingChanges;
        delete prop.hasPendingChanges;
      } else if (status === 'rejected') {
        // Discard changes, keep old data
        delete prop.pendingChanges;
        delete prop.hasPendingChanges;
      }
    } else {
      prop.status = status;
    }

    prop.statusReason = reason || '';
    await writeDb('properties', props);

    // Create notification for seller
    if (prop.ownerId && (status === 'approved' || status === 'rejected')) {
      const users = await readDb('users');
      const userIndex = users.findIndex(u => String(u.id) === String(prop.ownerId));
      if (userIndex !== -1) {
        users[userIndex].notifications = users[userIndex].notifications || [];
        let notifMsg = '';
        if (hadPendingChanges) {
          notifMsg = `Your edited changes for property "${prop.title || 'Untitled'}" (ID: HF${prop.id}) have been ${status.toUpperCase()} by admin.`;
        } else {
          notifMsg = `Your property "${prop.title || 'Untitled'}" (ID: HF${prop.id}) has been ${status.toUpperCase()} by admin.`;
        }
        users[userIndex].notifications.push({
          id: Date.now() + Math.random(),
          message: notifMsg,
          reason: reason || 'No reason provided',
          date: new Date().toISOString(),
          read: false
        });
        await writeDb('users', users);
      }
    }

    res.json(prop);
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

app.put('/api/properties/:id', upload.array('images', 10), async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  
  if (propIndex !== -1) {
    const existingImages = props[propIndex].images || [];
    
    // Process new files if uploaded
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(f => `/uploads/properties/${f.filename}`);
    }
    
    const images = newImages.length > 0 ? [...existingImages, ...newImages] : existingImages;
    const isApproved = props[propIndex].status === 'approved';

    const pendingFields = {
      propertyType: req.body.propertyType || props[propIndex].propertyType,
      title: req.body.title || props[propIndex].title,
      description: req.body.description || props[propIndex].description,
      price: req.body.price ? Number(req.body.price) : props[propIndex].price,
      address: req.body.address || props[propIndex].address,
      city: req.body.city || props[propIndex].city,
      state: req.body.state || props[propIndex].state,
      pincode: req.body.pincode || props[propIndex].pincode,
      mobile: req.body.mobile || props[propIndex].mobile,
      email: req.body.email || props[propIndex].email,
      location: req.body.location || props[propIndex].location,
      images,
      
      bedrooms: req.body.bedrooms ? Number(req.body.bedrooms) : props[propIndex].bedrooms,
      bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : props[propIndex].bathrooms,
      area: req.body.builtupArea ? Number(req.body.builtupArea) : (req.body.landArea ? Number(req.body.landArea) : props[propIndex].area),
      builtupArea: req.body.builtupArea ? Number(req.body.builtupArea) : props[propIndex].builtupArea,
      landArea: req.body.landArea ? Number(req.body.landArea) : props[propIndex].landArea,
      parkingSpaces: req.body.parkingSpaces ? Number(req.body.parkingSpaces) : props[propIndex].parkingSpaces,
      floorNumber: req.body.floorNumber ? Number(req.body.floorNumber) : props[propIndex].floorNumber,
      terraceArea: req.body.terraceArea ? Number(req.body.terraceArea) : props[propIndex].terraceArea,
      monthlyRent: req.body.monthlyRent ? Number(req.body.monthlyRent) : props[propIndex].monthlyRent,
      securityDeposit: req.body.securityDeposit ? Number(req.body.securityDeposit) : props[propIndex].securityDeposit,
      numberOfBeds: req.body.numberOfBeds ? Number(req.body.numberOfBeds) : props[propIndex].numberOfBeds,
      availableRooms: req.body.availableRooms ? Number(req.body.availableRooms) : props[propIndex].availableRooms,
      foodAvailable: req.body.foodAvailable === 'true',
      plotNumber: req.body.plotNumber || props[propIndex].plotNumber,
      surveyNumber: req.body.surveyNumber || props[propIndex].surveyNumber
    };

    if (isApproved) {
      props[propIndex].hasPendingChanges = true;
      props[propIndex].pendingChanges = pendingFields;
    } else {
      Object.assign(props[propIndex], pendingFields);
      props[propIndex].status = 'pending';
      delete props[propIndex].hasPendingChanges;
      delete props[propIndex].pendingChanges;
    }

    await writeDb('properties', props);
    res.json(props[propIndex]);
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

// Delete request endpoint
app.put('/api/properties/:id/delete-request', async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  if (propIndex !== -1) {
    const { reason } = req.body;
    props[propIndex].status = 'pending_delete';
    props[propIndex].deleteReason = reason || 'No reason provided';
    await writeDb('properties', props);
    res.json(props[propIndex]);
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

// --- OTP Email Sending Helper ---
const sendOTPEmail = async (toEmail, otp) => {
  try {
    // If SMTP credentials are provided, use them. Otherwise, log it and return.
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: `"Real Estate Platform" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "Your OTP Verification Code",
        text: `Your OTP verification code is: ${otp}. It is valid for 10 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #3b82f6; margin-top: 0;">OTP Verification</h2>
                <p>You requested a password reset. Use the following 6-digit OTP code to complete the process:</p>
                <div style="font-size: 24px; font-weight: bold; background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="font-size: 12px; color: #64748b;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
               </div>`
      });
      console.log(`[REAL-TIME EMAIL] Successfully sent OTP ${otp} to ${toEmail}`);
    } else {
      console.log(`
==================================================
[REAL-TIME EMAIL OUTBOX - NO SMTP CONFIGURED]
TO: ${toEmail}
SUBJECT: Your OTP Verification Code
BODY: Your OTP verification code is ${otp}
==================================================
      `);
    }
  } catch (err) {
    console.error('Failed to send real-time OTP email:', err.message);
  }
};

// Send OTP Endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const users = await readDb('users');
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Email or Mobile is required.' });
    }
    const userIndex = users.findIndex(u => (
      (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
      (u.mobile === identifier)
    ));
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    users[userIndex].otp = otp;
    users[userIndex].otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await writeDb('users', users);

    // Send email/log OTP in real-time
    const targetEmail = users[userIndex].email || 'no-reply@realestate.com';
    await sendOTPEmail(targetEmail, otp);

    res.json({ message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Internal server error during OTP sending.' });
  }
});

// Forgot Password OTP verification and reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const users = await readDb('users');
  const { identifier, newPassword, otp } = req.body;
  const userIndex = users.findIndex(u => (
    (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
    (u.mobile === identifier)
  ));
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = users[userIndex];

  // Verify OTP
  if (!user.otp || user.otp !== String(otp)) {
    return res.status(400).json({ message: 'Invalid OTP code. Please request a new one.' });
  }

  if (user.otpExpiry && Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' });
  }

  // Clear OTP and set new password
  user.otp = null;
  user.otpExpiry = null;

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.plainPassword = newPassword;
  
  users[userIndex] = user;
  await writeDb('users', users);

  res.json({ message: 'Password reset successfully' });
});

// Social Login Verification Endpoint
app.post('/api/auth/social-login', async (req, res) => {
  try {
    const users = await readDb('users');
    const { email, provider, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ message: `This ${provider} account (${email}) is not registered. Please register first.` });
    }

    if (user.status === 'deactivated' || user.status === 'rejected') {
      return res.status(400).json({ message: `Your account is currently ${user.status}.` });
    }

    // Optional role check if logging into a specific dashboard (seller dashboard or admin console)
    if (role && user.role !== role) {
      return res.status(400).json({ message: `This account is registered as a ${user.role}, not a ${role}.` });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ message: 'Internal server error during social login.' });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  if (propIndex !== -1) {
    const prop = props[propIndex];
    const reason = req.body.reason || req.query.reason || 'Deleted by admin';

    // Create notification for seller
    if (prop.ownerId) {
      const users = await readDb('users');
      const userIndex = users.findIndex(u => String(u.id) === String(prop.ownerId));
      if (userIndex !== -1) {
        users[userIndex].notifications = users[userIndex].notifications || [];
        users[userIndex].notifications.push({
          id: Date.now() + Math.random(),
          message: `Your property "${prop.title || 'Untitled'}" (ID: HF${prop.id}) has been DELETED by admin.`,
          reason: reason,
          date: new Date().toISOString(),
          read: false
        });
        await writeDb('users', users);
      }
    }

    prop.status = 'deleted';
    prop.deleteReason = reason;
    await writeDb('properties', props);
    await logEvent('DELETION', `Property HF${prop.id} ("${prop.title}") directly deleted by admin. Reason: ${reason}`, { propertyId: prop.id, title: prop.title, ownerId: prop.ownerId });
    res.json({ message: 'Property deleted successfully' });
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

// Logs Endpoint
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await readDb('logs');
    // Sort in reverse order (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to read logs' });
  }
});


// ------- ENQUIRY ROUTES -------
app.post('/api/enquiries', async (req, res) => {
  const enquiries = await readDb('enquiries');
  const newEnquiry = {
    id: enquiries.length + 1,
    date: new Date().toISOString(),
    ...req.body
  };
  enquiries.push(newEnquiry);
  await writeDb('enquiries', enquiries);

  // Link enquiry natively to the property struct to auto-populate metrics
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.body.propertyId);
  if (propIndex !== -1) {
    if (!props[propIndex].inquiries) props[propIndex].inquiries = [];
    props[propIndex].inquiries.push(newEnquiry);
    await writeDb('properties', props);
  }

  res.status(201).json(newEnquiry);
});

app.get('/api/enquiries', async (req, res) => {
  res.json(await readDb('enquiries'));
});

app.get('/api/enquiries/user/:userId', async (req, res) => {
  const enquiries = await readDb('enquiries');
  const userEnquiries = enquiries.filter(e => String(e.userId) === String(req.params.userId));
  res.json(userEnquiries);
});

app.post('/api/properties/:id/reviews', async (req, res) => {
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == req.params.id);
  if (propIndex === -1) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const { userId, userName, rating, comment } = req.body;
  if (!userId || !userName || !rating || !comment) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const newReview = {
    id: Date.now(),
    userId,
    userName,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  props[propIndex].reviews = props[propIndex].reviews || [];
  props[propIndex].reviews.push(newReview);
  await writeDb('properties', props);

  res.status(201).json(newReview);
});


// ------- USER PROFILE ROUTE -------
app.get('/api/users', async (req, res) => {
  res.json(await readDb('users'));
});

app.get('/api/users/:id', async (req, res) => {
  const users = await readDb('users');
  const user = users.find(u => String(u.id) === String(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const users = await readDb('users');
  const userIndex = users.findIndex(u => u.id == req.params.id);
  if (userIndex !== -1) {
    if (users[userIndex].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin nodes' });
    }
    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    await writeDb('users', users);
    await logEvent('USER_DELETION', `User ${deletedUser.id} (${deletedUser.name}) was permanently deleted.`, { userId: deletedUser.id, name: deletedUser.name, role: deletedUser.role });
    res.json({ message: 'User deleted' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const users = await readDb('users');
  const userIndex = users.findIndex(u => String(u.id) === String(req.params.id));

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = { ...users[userIndex], ...req.body };
  users[userIndex] = updatedUser;
  await writeDb('users', users);

  res.json(updatedUser);
});

// ------- BOOKING ROUTES -------
app.post('/api/bookings', async (req, res) => {
  const bookings = await readDb('bookings');
  const { buyerId, propertyId, expectedPrice, billingAmount, status } = req.body;
  
  const props = await readDb('properties');
  const propIndex = props.findIndex(p => p.id == propertyId);
  let propertyTitle = 'Unknown Property';
  
  if (propIndex !== -1) {
    props[propIndex].status = 'under_negotiation'; // Mark as booked / under negotiation
    propertyTitle = props[propIndex].title;
    await writeDb('properties', props);
  }
  
  const newBooking = {
    id: bookings.length + 1,
    date: new Date().toISOString(),
    buyerId: Number(buyerId),
    propertyId: Number(propertyId),
    propertyTitle,
    expectedPrice: Number(expectedPrice),
    billingAmount: Number(billingAmount),
    status: status || 'Pending'
  };
  
  bookings.push(newBooking);
  await writeDb('bookings', bookings);
  res.status(201).json(newBooking);
});

app.get('/api/bookings', async (req, res) => {
  res.json(await readDb('bookings'));
});

app.get('/api/bookings/seller/:sellerId', async (req, res) => {
  const bookings = await readDb('bookings');
  const props = await readDb('properties');
  const sellerPropsIds = props.filter(p => p.ownerId == req.params.sellerId).map(p => p.id);
  const sellerBookings = bookings.filter(b => sellerPropsIds.includes(Number(b.propertyId)));
  res.json(sellerBookings);
});

app.get('/api/bookings/buyer/:buyerId', async (req, res) => {
  const bookings = await readDb('bookings');
  res.json(bookings.filter(b => b.buyerId == req.params.buyerId));
});

const PORT = 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with MongoDB persistence.`);
  });
}).catch(err => {
  console.warn("Starting server with local JSON fallback due to MongoDB connection failure.");
  app.listen(PORT, () => {
    console.log(`Mock server running on port ${PORT} with local JSON persistence (fallback).`);
  });
});
