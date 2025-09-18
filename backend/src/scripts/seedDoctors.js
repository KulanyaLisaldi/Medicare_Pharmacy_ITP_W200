import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

/**
 * Seed Doctors Script
 * Creates or updates a set of doctor users in the database
 */
async function seedDoctors() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Default doctor password (can override via env)
    const defaultPassword = process.env.SEED_DOCTOR_PASSWORD || 'Doctor@12345';

    // Define the doctors to seed
    const doctorsToSeed = [
      {
        firstName: 'Alice',
        lastName: 'Hart',
        email: 'alice.hart@medicare.com',
        password: defaultPassword,
        role: 'doctor',
        address: '123 Health Ave, Wellness City',
        phone: '+1-555-1001',
        specialization: 'Cardiology',
        otherSpecialization: '',
        licenseNumber: 'DOC-CARD-0001',
        experience: 10,
        experienceYears: 10,
        practicingGovernmentHospital: 'Wellness General Hospital',
        achievements: 'Published 5 research papers in cardiology',
        membership: 'American College of Cardiology',
        registrationNumber: 'REG-DOC-1001',
        specialNote: 'Special interest in preventive cardiology',
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Brian',
        lastName: 'Nguyen',
        email: 'brian.nguyen@medicare.com',
        password: defaultPassword,
        role: 'doctor',
        address: '456 Care St, Healthy Town',
        phone: '+1-555-1002',
        specialization: 'Dermatology',
        otherSpecialization: '',
        licenseNumber: 'DOC-DERM-0002',
        experience: 7,
        experienceYears: 7,
        practicingGovernmentHospital: 'Healthy Town Clinic',
        achievements: 'Lead clinician for eczema program',
        membership: 'American Academy of Dermatology',
        registrationNumber: 'REG-DOC-1002',
        specialNote: 'Teledermatology experience',
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Chandni',
        lastName: 'Patel',
        email: 'chandni.patel@medicare.com',
        password: defaultPassword,
        role: 'doctor',
        address: '789 Relief Blvd, Harmony Hills',
        phone: '+1-555-1003',
        specialization: 'Pediatrics',
        otherSpecialization: 'Neonatology',
        licenseNumber: 'DOC-PED-0003',
        experience: 8,
        experienceYears: 8,
        practicingGovernmentHospital: 'Harmony Children Hospital',
        achievements: 'Pediatric patient advocacy awards',
        membership: 'American Academy of Pediatrics',
        registrationNumber: 'REG-DOC-1003',
        specialNote: 'Focus on infant nutrition',
        isVerified: true,
        isActive: true
      }
    ];

    console.log(`🔍 Seeding ${doctorsToSeed.length} doctor(s)...`);

    for (const doctorData of doctorsToSeed) {
      const { email } = doctorData;
      let existing = await User.findOne({ email });

      if (!existing) {
        console.log(`📝 Creating doctor: ${doctorData.firstName} ${doctorData.lastName} <${email}>`);
        const doctor = new User(doctorData);
        await doctor.save();
        console.log('   ✅ Created');
      } else {
        console.log(`🔄 Doctor already exists for email ${email}. Ensuring role and flags...`);
        const updates = {};
        let hasUpdates = false;

        if (existing.role !== 'doctor') {
          updates.role = 'doctor';
          hasUpdates = true;
        }
        if (!existing.isVerified) {
          updates.isVerified = true;
          hasUpdates = true;
        }
        if (existing.isActive === false) {
          updates.isActive = true;
          hasUpdates = true;
        }
        // Fill in doctor-specific profile fields if missing
        const profileFields = [
          'specialization',
          'otherSpecialization',
          'licenseNumber',
          'experience',
          'experienceYears',
          'practicingGovernmentHospital',
          'achievements',
          'membership',
          'registrationNumber',
          'specialNote',
          'address',
          'phone'
        ];

        for (const field of profileFields) {
          if ((existing[field] === undefined || existing[field] === '' || existing[field] === 0) && doctorData[field] !== undefined) {
            updates[field] = doctorData[field];
            hasUpdates = true;
          }
        }

        if (hasUpdates) {
          await User.updateOne({ _id: existing._id }, { $set: updates });
          console.log('   ✅ Updated existing doctor');
        } else {
          console.log('   ✅ No updates needed');
        }
      }
    }

    console.log('\n🎉 Doctors seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
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
seedDoctors();


