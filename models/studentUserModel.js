// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String, required: false, default: "" },
    bio: { type: String, default: "" },
    title: { type: String },
    role: {
      type: String,
      enum: ['student', 'pending-tutor', 'tutor'],
      default: 'student',
    },
    isGoogleUser: { type: Boolean, default: false },

    fullName: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phoneNumber: String,
    address: {
      city: String,
      country: String,
    },
    highestQualification: String,
    institutionName: String,
    graduationYear: Number,
    subjectsOfExpertise: [String],
    experienceYears: Number,
    pastInstitutions: [String],
    certifications: [String],
    availability: {
      days: [String],
      timeSlots: [String],
    },
    resumeUrl: String,
    educationCertificates: {
      type: [String],
      default: [],
    },
    idProofUrl: String,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
