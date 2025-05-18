// utils/createAdmin.js
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// Replace this with your actual MongoDB URI
const MONGO_URI = 'mongodb://127.0.0.1:27017/E-Tutor'; // match exact casing

const createAdminUser = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
    //   useUnifiedTopology: true,
    });

    const adminData = {
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin', // <-- Add this
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        isAdmin: true,
        role: 'Tutor',
      };
      

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      const admin = new User(adminData);
      await admin.save();
      console.log('Admin user created successfully');
    }

    mongoose.disconnect(); // disconnect after operation
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdminUser();
