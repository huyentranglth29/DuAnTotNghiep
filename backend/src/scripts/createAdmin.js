const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");

const ADMIN_EMAIL = "admin@filmgo.com";

async function createAdmin() {
  await connectDB();

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAdmin) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    fullName: "FilmGo Admin",
    email: ADMIN_EMAIL,
    password: "Admin@123456",
    role: "admin",
    status: "active",
  });

  console.log(`Created admin: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

createAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
