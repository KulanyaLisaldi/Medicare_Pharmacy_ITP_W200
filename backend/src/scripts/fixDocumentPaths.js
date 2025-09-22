import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDocumentPaths = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicare');
    console.log('Connected to database');

    // Find all bookings with documents
    const bookings = await Booking.find({ documents: { $exists: true, $ne: [] } });
    console.log(`Found ${bookings.length} bookings with documents`);

    let updatedCount = 0;

    for (const booking of bookings) {
      let needsUpdate = false;
      const updatedDocuments = booking.documents.map(doc => {
        // Check if path starts with uploads/ (correct format) or is a full file path
        if (doc.path && !doc.path.startsWith('/uploads/')) {
          // Extract filename from the path
          const filename = doc.filename || doc.path.split('/').pop();
          const newPath = `/uploads/bookings/${filename}`;
          needsUpdate = true;
          return { ...doc, path: newPath };
        }
        return doc;
      });

      if (needsUpdate) {
        await Booking.findByIdAndUpdate(booking._id, { documents: updatedDocuments });
        updatedCount++;
        console.log(`Updated booking ${booking._id}`);
      }
    }

    console.log(`Updated ${updatedCount} bookings`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing document paths:', error);
    process.exit(1);
  }
};

fixDocumentPaths();
