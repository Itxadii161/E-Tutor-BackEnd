import mongoose from 'mongoose';

// Rating Schema to store individual ratings
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Reference to the user who rated
  rating: { type: Number, required: true, min: 1, max: 5 },       // Rating given by the user (1 to 5)
  review: { type: String, default: '' },                            // Optional review text
  date: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String, default: "" },
    bio: { type: String, default: "" },

    role: {
      type: String,
      enum: ['Student', 'Pending-Tutor', 'Tutor'],
      default: 'Student',
    },
    
    isGoogleUser: { type: Boolean, default: false },

    // Personal Info
    fullName: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phoneNumber: String,
    address: {
      country: String,
      state: String,
      city: String,
      village: String,
    },

    // Education & Credentials
    highestQualification: String,
    institutionName: String,
    graduationYear: Number,
    pastInstitutions: [String],
    certifications: [String],
    educationCertificates: { type: [String], default: [] },
    resumeUrl: String,
    idProofUrl: String,

    // Tutor Specific
    // subjectsOfExpertise: [String], // Quick tags
    subjectsOfExpertise: {
      type: [String], // <-- array of strings
      default: [],
    },
    
    experienceYears: Number,
    availability: {
      days: [String],        // e.g., ["Monday", "Wednesday"]
      timeSlots: [String],   // e.g., ["10am-12pm", "2pm-4pm"]
    },
    hourlyRate: { type: Number, default: 0 },
    teachingMode: {
      type: [String],
      enum: ['online', 'in-person'],
      default: ['online'],
    },
    languagesSpoken: { type: [String], default: [] },

    // Reviews & Rating
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    ratings: [ratingSchema], // Store individual ratings
       
    hiredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference to users who have hired the tutor

    // Verification & Trust
    isVerified: { type: Boolean, default: false },

    // Optional GeoJSON for location-based search
    locationCoordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  { timestamps: true }
);

// Indexing for geospatial queries (if location-based search is needed)
userSchema.index({ locationCoordinates: '2dsphere' });

// Virtual to calculate the average rating
userSchema.virtual('averageRatingCalculated').get(function () {
  if (this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return total / this.ratings.length;
});

const User = mongoose.model('User', userSchema);
export default User;
