/**
 * Create Admin User Script
 * Usage: node scripts/createAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Adjust path if needed
const dbConfig = require("../config/dbConfig"); // Ensure db connection

const createAdmin = async () => {
  try {
    // Wait for DB connection if not handled by require
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const email = "admin@example.com";
    const password = "admin123";
    const name = "CineLog Admin";

    // Check if admin exists
    let admin = await User.findOne({ email });

    if (admin) {
      console.log("Admin user found. Updating role and password...");
      admin.role = "admin";
      admin.password = await bcrypt.hash(password, 12);
      admin.name = name;
      await admin.save();
    } else {
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(password, 12);
      admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });
    }

    console.log(`
    ✅ Admin User Configured Successfully!
    -------------------------------------------
    Email:    ${email}
    Password: ${password}
    Role:     ${admin.role}
    -------------------------------------------
    You can now log in to the CineLog Admin Panel.
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

// Delay slightly to ensure DB connection is established if using independent file
setTimeout(createAdmin, 2000);
