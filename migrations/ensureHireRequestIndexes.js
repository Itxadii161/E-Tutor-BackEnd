// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import HireRequest from '../models/hireRequestModel.js';

async function migrate() {
  try {
    // Drop existing unique index if it exists
    try {
      await HireRequest.collection.dropIndex('student_1_tutor_1');
      console.log('Old index student_1_tutor_1 dropped');
    } catch (err) {
      console.log('Index did not exist or could not be dropped');
    }

    // Create new indexes
    await HireRequest.collection.createIndex({ student: 1, tutor: 1 });
    await HireRequest.collection.createIndex({ status: 1 });
    await HireRequest.collection.createIndex({ updatedAt: 1 });

    console.log('HireRequest indexes migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    mongoose.disconnect();
  }
}

// Connect to MongoDB and run migration
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => migrate())
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
