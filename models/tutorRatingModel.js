// models/tutorRatingModel.js
import mongoose from 'mongoose';

const tutorRatingSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

tutorRatingSchema.index({ tutor: 1, student: 1 }, { unique: true });

export default mongoose.model('TutorRating', tutorRatingSchema);
