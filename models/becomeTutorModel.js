import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    city: String,
    country: String,
  },

  // Educational Background
  highestQualification: {
    type: String,
    required: true,
  },
  institutionName: {
    type: String,
    required: true,
  },
  graduationYear: {
    type: Number,
    required: true,
  },
  subjectsOfExpertise: {
    type: [String],
    required: true,
  },

  // Teaching Experience
  experienceYears: {
    type: Number,
    required: true,
  },
  pastInstitutions: [String],
  certifications: [String], // e.g., ["TESOL", "PGCE"]

  // Availability
  availability: {
    days: [String], // e.g., ["Monday", "Wednesday"]
    timeSlots: [String], // e.g., ["Morning", "Evening"]
  },

  // Required Documents
  resumeUrl: {
    type: String,
    required: true,
  },
  educationCertificates: {
    type: [String], // array of URLs to documents
    validate: [(val) => val.length > 0, 'At least one certificate is required.'],
    required: true,
  },

  // Optional Verification
  idProofUrl: String,

  // Application Status
  role: {
    type: String,
    enum: ['student', 'pending-tutor', 'tutor'],
    default: 'student',
  },

  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('becomeTutor', userSchema);
