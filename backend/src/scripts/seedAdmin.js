import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

/**
 * Seed Admin User Script
 * Creates or updates an admin user in the database
 */
async function seedAdmin() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Admin credentials from environment variables or defaults
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@medicare.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

    console.log(`🔍 Checking for existing admin user: ${adminEmail}`);

    // Check if admin user already exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      // Create new admin user
      console.log('📝 Creating new admin user...');
      
      adminUser = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: adminPassword,
        address: 'System Address',
        phone: 'N/A',
        role: 'admin',
        isVerified: true,
        isActive: true,
        profileImage: '',
        registrationNumber: 'ADMIN001'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Role: ${adminUser.role}`);
      
    } else {
      // Update existing user to admin if needed
      console.log('🔄 Admin user already exists, checking permissions...');
      
      const updates = {};
      let hasUpdates = false;

      // Check and update role if needed
      if (adminUser.role !== 'admin') {
        updates.role = 'admin';
        hasUpdates = true;
        console.log('   🔄 Updating role to admin');
      }

      // Check and update verification status
      if (!adminUser.isVerified) {
        updates.isVerified = true;
        hasUpdates = true;
        console.log('   🔄 Marking as verified');
      }

      // Check and update active status
      if (adminUser.isActive === false) {
        updates.isActive = true;
        hasUpdates = true;
        console.log('   🔄 Activating account');
      }

      // Check and update name fields if they're missing
      if (!adminUser.firstName || !adminUser.lastName) {
        updates.firstName = adminUser.firstName || 'System';
        updates.lastName = adminUser.lastName || 'Admin';
        hasUpdates = true;
        console.log('   🔄 Updating name fields');
      }

      if (hasUpdates) {
        await User.updateOne(
          { _id: adminUser._id }, 
          { $set: updates }
        );
        console.log('✅ Admin user updated successfully!');
      } else {
        console.log('✅ Admin user already has all required permissions');
      }

      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${adminUser.firstName || 'System'} ${adminUser.lastName || 'Admin'}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Verified: ${adminUser.isVerified}`);
      console.log(`   Active: ${adminUser.isActive}`);
    }

    console.log('\n🎉 Admin seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the seed function
seedAdmin();
