// models/tutorHireModel.js
import mongoose from 'mongoose';

const tutorHireSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  status: { type: String, default: 'pending' } // pending/accepted/rejected
}, { timestamps: true });

export default mongoose.model('TutorHire', tutorHireSchema);
