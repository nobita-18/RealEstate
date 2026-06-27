const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbFiles = {
  users: path.join(__dirname, 'database', 'users.json'),
  properties: path.join(__dirname, 'database', 'properties.json'),
};

const readDb = (key) => JSON.parse(fs.readFileSync(dbFiles[key], 'utf8'));
const writeDb = (key, data) => fs.writeFileSync(dbFiles[key], JSON.stringify(data, null, 2));

async function seed() {
  const users = readDb('users');
  let properties = readDb('properties');

  // Create Seller Bala
  const sellerEmail = 'Bala@gmail.com';
  let seller = users.find(u => u.email === sellerEmail);

  if (!seller) {
    const hashedPassword = await bcrypt.hash('password@123buy', 10);
    seller = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name: 'Bala',
      email: sellerEmail,
      username: 'Bala',
      password: hashedPassword,
      role: 'seller',
      mobile: '9876543210',
      status: 'active'
    };
    users.push(seller);
    writeDb('users', users);
    console.log('Created seller Bala.');
  } else {
    console.log('Seller Bala already exists.');
  }

  // Remove ALL existing properties to permanently delete previously created
  // The user requested to "Permanatly delete previously created" and recreate.
  properties = [];

  const locations = ["Anna Nagar", "Adyar", "T Nagar", "Velachery", "OMR", "Porur", "ECR", "Tambaram", "Guindy", "Chromepet"];
  const adjectives = ["Luxury", "Modern", "Spacious", "Cozy", "Elegant", "Premium", "Serene", "Urban", "Classic", "Grand"];
  
  const generateImages = (type, index) => {
    // source.unsplash.com is deprecated, using direct working links
    const houseImages = [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80'
    ];
    const pgImages = [
      'https://images.unsplash.com/photo-1522771731478-44eb10e5c775?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
    ];
    const landImages = [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1416879598466-07e4dbcb7b33?auto=format&fit=crop&w=600&q=80'
    ];
    
    let arr = houseImages;
    if (type === 'PG') arr = pgImages;
    else if (type === 'Land') arr = landImages;

    return [
      arr[(index) % arr.length],
      arr[(index + 1) % arr.length],
      arr[(index + 2) % arr.length]
    ];
  };

  const getDynamicFields = (type, index) => {
    const base = {
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '60000' + (index % 10),
      address: `No ${index + 1}, Main Road`,
      mobile: '9876543210',
      email: sellerEmail,
    };

    if (type === 'House') {
      return { ...base, bathrooms: 2 + (index % 3), builtupArea: 1000 + (index * 100) };
    } else if (type === 'Penthouse') {
      return { ...base, floorNumber: 5 + (index % 10), terraceArea: 300 + (index * 50) };
    } else if (type === 'Villa') {
      return { ...base, landArea: 2000 + (index * 200), parkingSpaces: 1 + (index % 3) };
    } else if (type === 'PG') {
      return { 
        ...base, 
        pgName: `Comfort Stay PG ${index}`,
        monthlyRent: 8000 + (index * 500),
        securityDeposit: 15000 + (index * 1000),
        pgType: index % 2 === 0 ? 'Boys' : 'Girls',
        sharingType: `${(index % 3) + 1} Sharing`,
        numberOfBeds: 10 + index,
        availableRooms: 2 + (index % 4),
        foodAvailable: index % 2 === 0
      };
    } else if (type === 'Land') {
      return {
        ...base,
        landArea: 5000 + (index * 500),
        plotNumber: `P-${100 + index}`,
        surveyNumber: `S-${200 + index}`
      };
    }
    return base;
  };

  const generateProperties = (type, count, isRent, startIndex) => {
    for (let i = 0; i < count; i++) {
      const globalIndex = startIndex + i;
      const location = locations[globalIndex % locations.length];
      const adj = adjectives[globalIndex % adjectives.length];
      const id = properties.length + 1;
      const statuses = ["approved", "pending", "rejected", "live"];
      
      let price;
      if (isRent) {
        price = type === 'PG' ? 8000 + (globalIndex * 500) : 20000 + (globalIndex * 1000);
      } else {
        price = type === 'Land' ? 5000000 + (globalIndex * 500000) : 10000000 + (globalIndex * 1000000);
      }

      let title = `${adj} ${type} in ${location}`;
      if (type === 'PG') title = `Comfort Stay PG ${globalIndex}`;

      properties.push({
        id,
        title,
        description: `A highly sought-after ${type.toLowerCase()} located in the heart of ${location}. Perfect for your needs. Contains all essential amenities.`,
        price,
        location,
        propertyType: type,
        propertyFor: isRent ? 'Rent' : 'Sale',
        bedrooms: type === 'Land' ? 0 : type === 'PG' ? 1 : (globalIndex % 3) + 2,
        area: type === 'PG' ? 200 : 1000 + (globalIndex * 100),
        images: generateImages(type, globalIndex),
        ownerId: seller.id,
        status: statuses[globalIndex % statuses.length],
        isNew: globalIndex % 2 === 0,
        isFeatured: globalIndex % 3 === 0,
        ...getDynamicFields(type, globalIndex)
      });
    }
  };

  generateProperties('Villa', 5, false, 0);
  generateProperties('Villa', 5, true, 5);
  generateProperties('House', 5, false, 10);
  generateProperties('House', 5, true, 15);
  generateProperties('Penthouse', 10, false, 20);
  generateProperties('Land', 10, false, 30);
  generateProperties('PG', 10, true, 40);

  const specificProps = [
    {
      id: properties.length + 1,
      title: "LINGAM home",
      description: "A specific home for LINGAM",
      price: 15000000,
      location: "Anna Nagar",
      propertyType: "House",
      propertyFor: "Sale",
      bedrooms: 3,
      area: 2000,
      images: generateImages("House", 100),
      ownerId: seller.id,
      status: "approved",
      isNew: true,
      isFeatured: true,
      ...getDynamicFields('House', 100)
    },
    {
      id: properties.length + 2,
      title: "LINGAM Villa",
      description: "A specific villa for LINGAM",
      price: 25000000,
      location: "ECR",
      propertyType: "Villa",
      propertyFor: "Sale",
      bedrooms: 4,
      area: 3500,
      images: generateImages("Villa", 101),
      ownerId: seller.id,
      status: "pending",
      isNew: true,
      isFeatured: true,
      ...getDynamicFields('Villa', 101)
    },
    {
      id: properties.length + 3,
      title: "LINGAM penthouse",
      description: "A specific penthouse for LINGAM",
      price: 45000000,
      location: "OMR",
      propertyType: "Penthouse",
      propertyFor: "Sale",
      bedrooms: 5,
      area: 4000,
      images: generateImages("Penthouse", 102),
      ownerId: seller.id,
      status: "rejected",
      isNew: true,
      isFeatured: true,
      ...getDynamicFields('Penthouse', 102)
    },
    {
      id: properties.length + 4,
      title: "LINGAM land",
      description: "A specific land for LINGAM",
      price: 10000000,
      location: "Tambaram",
      propertyType: "Land",
      propertyFor: "Sale",
      bedrooms: 0,
      area: 5000,
      images: generateImages("Land", 103),
      ownerId: seller.id,
      status: "live",
      isNew: true,
      isFeatured: true,
      ...getDynamicFields('Land', 103)
    },
    {
      id: properties.length + 5,
      title: "LINGAM PG",
      description: "A specific PG for LINGAM",
      price: 8000,
      location: "Velachery",
      propertyType: "PG",
      propertyFor: "Rent",
      bedrooms: 1,
      area: 200,
      images: generateImages("PG", 104),
      ownerId: seller.id,
      status: "approved",
      isNew: true,
      isFeatured: true,
      ...getDynamicFields('PG', 104)
    }
  ];

  properties = properties.concat(specificProps);
  writeDb('properties', properties);
  console.log(`Added ${properties.length} properties for Bala.`);
}

seed().catch(console.error);
