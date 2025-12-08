import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoc';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@microsoc.com',
      password: 'Admin@12345',
      fullName: 'System Administrator',
      role: 'admin',
      status: 'active',
      permissions: User.getAllPermissions(),
      department: 'IT Security',
      reasonForAccess: 'System Administrator'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@12345');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
