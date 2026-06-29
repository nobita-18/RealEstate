# MERN Real Estate Platform

A premium, full-stack MERN real estate listing platform featuring dedicated user portals, automated property approval workflows, and strict data validation.

---

## 🚀 Key Features

* **Multi-Portal Architecture**: Dedicated interfaces tailored specifically for **Buyers**, **Sellers / Agents**, and **Admins**.
* **Automated Admin Approval System**: Sellers submit properties which default to `pending` status. Admins approve/reject listings before they appear in the buyer portal.
* **Strict Database Uniqueness Rules**: System-level constraints enforce 100% unique **Email**, **Mobile Number**, and **User ID** across all accounts.
* **Self-Healing Database Sync**: On boot, the server automatically cleans legacy Atlas unique indexes and performs a force-synchronization from local JSON backups to MongoDB Atlas.
* **Mobile First Design**: Fully responsive CSS layouts with collapsing navigation, block-level table structures, and auto-fitting property grids.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), CSS3, Lucide React
* **Backend**: Node.js, Express.js, JWT Authentication, Multer Uploads
* **Database**: MongoDB Atlas (Mongoose) with local JSON fallback persistence
* **Utilities**: Bcrypt.js (Password encryption)

---

## 📋 Mock Accounts Inventory (For Verification)

Use these accounts to test various roles. All accounts have unique emails and mobile numbers.

| Portal | User Name | Email | Password | Mobile Number | Role / Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Console** | Rajesh Admin | `rajesh.admin@gmail.com` | `admin123` | `9876543216` | Full Access admin user |
| **Admin Console** | Suresh Admin | `suresh.admin@gmail.com` | `admin456` | `9876543217` | Full Access admin user |
| **Seller Portal** | Karthik Seller | `karthik.seller@gmail.com` | `seller123` | `9876543210` | Manages 3 properties (1 Live House, 1 Pending PG, 1 Delete-Requested Land) |
| **Seller Portal** | Priya Seller | `priya.seller@gmail.com` | `seller456` | `9876543211` | Manages 3 properties (1 Live Villa, 1 Pending Penthouse, 1 Delete-Requested House) |
| **Seller Portal** | Vijay Seller | `vijay.seller@gmail.com` | `seller789` | `9876543212` | Manages 3 properties (1 Live PG, 1 Pending Land, 1 Delete-Requested Villa) |
| **Buyer Portal** | Anand Buyer | `anand.buyer@gmail.com` | `buyer123` | `9876543213` | Buyer user (has sent 5 enquiries to properties 1, 2, 4, 5, 7) |
| **Buyer Portal** | Divya Buyer | `divya.buyer@gmail.com` | `buyer456` | `9876543214` | Buyer user (has sent 5 enquiries to properties 2, 3, 4, 7, 8) |
| **Buyer Portal** | Manoj Buyer | `manoj.buyer@gmail.com` | `buyer789` | `9876543215` | Buyer user (has sent 5 enquiries to properties 1, 4, 5, 7, 9) |

---

## 🏃 Getting Started Locally

### Prerequisites
* Node.js installed (v16+ recommended)
* A running MongoDB local instance OR connection string configured in `.env`

### Installation
From the root workspace directory, run:
```bash
npm run install-all
```
This automatically installs all dependencies across root, server, and client.

### Environment Setup
Create a `.env` file in the `server/` directory and populate your Atlas connection string:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.frzsmli.mongodb.net/real-estate-platform
JWT_SECRET=your_jwt_secret_key
```

### Run the Application
Start both the backend server and client dev server concurrently by running:
```bash
npm start
```
* **Frontend Access**: `http://localhost:5173`
* **Backend API Base**: `http://localhost:5000`
