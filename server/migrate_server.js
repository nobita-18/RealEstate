const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
const backupFile = path.join(__dirname, 'server.js.bak');

// Backup original file
fs.copyFileSync(serverFile, backupFile);
console.log('Backed up server.js to server.js.bak');

let content = fs.readFileSync(serverFile, 'utf8');

// 1. Add imports at the top
const imports = `const { connectDB, isMongoDBActive } = require('./database/db');
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
`;

// Find where express is imported and insert imports below it
content = content.replace(
  "const express = require('express');",
  "const express = require('express');\n" + imports
);

// 2. Modify readDb and writeDb definitions
const newReadDb = `const readDb = async (key) => {
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
};`;

const newWriteDb = `const writeDb = async (key, data) => {
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
};`;

content = content.replace(/const readDb = [\s\S]*?;\r?\n/, newReadDb + '\n');
content = content.replace(/const writeDb = [\s\S]*?;\r?\n/, newWriteDb + '\n');

// 3. Make logEvent async
content = content.replace(
  "const logEvent = (type, message, details = {}) => {",
  "const logEvent = async (type, message, details = {}) => {"
);

// 4. Make all route handlers async (except those already marked async)
// We match: (req, res) => { or (req, res) =>  (without async before)
content = content.replace(/(?<!async\s+)\(\s*req,\s*res\s*\)\s*=>\s*\{/g, 'async (req, res) => {');

// 5. Prepend await to all readDb, writeDb, and logEvent calls
// We use regex with negative lookbehind to avoid prepending if it's a definition or already has await
content = content.replace(/(?<!const\s+)(?<!async\s+)(?<!await\s+)\breadDb\(/g, 'await readDb(');
content = content.replace(/(?<!const\s+)(?<!async\s+)(?<!await\s+)\bwriteDb\(/g, 'await writeDb(');
content = content.replace(/(?<!const\s+)(?<!async\s+)(?<!await\s+)\blogEvent\(/g, 'await logEvent(');

// 6. Replace server listening at the end
const oldListen = `const PORT = 5000;
app.listen(PORT, () => {
  console.log(\`Mock server running on port \${PORT} with local JSON persistence.\`);
});`;

const newListen = `const PORT = 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT} with MongoDB persistence.\`);
  });
}).catch(err => {
  console.warn("Starting server with local JSON fallback due to MongoDB connection failure.");
  app.listen(PORT, () => {
    console.log(\`Mock server running on port \${PORT} with local JSON persistence (fallback).\`);
  });
});`;

// In case the string matches slightly differently, use regex
content = content.replace(/const PORT = 5000;[\s\S]*?app\.listen[\s\S]*?\n\}\);/, newListen);

fs.writeFileSync(serverFile, content, 'utf8');
console.log('Successfully migrated server.js to use MongoDB Atlas / Fallback persistence!');
