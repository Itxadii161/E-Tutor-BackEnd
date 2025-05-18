import mongoose from 'mongoose';

const hireRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Regular non-unique index
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Regular non-unique index
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'superseded'],
    default: 'pending',
    index: true // Index for faster status queries
  },
  // Add version tracking
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  // Prevent version key conflicts
  versionKey: 'modelVersion'
});

// Middleware to ensure no duplicate active requests
hireRequestSchema.pre('save', async function(next) {
  if (this.isNew && (this.status === 'pending' || this.status === 'accepted')) {
    const existing = await mongoose.model('HireRequest').findOne({
      student: this.student,
      tutor: this.tutor,
      status: { $in: ['pending', 'accepted'] },
      _id: { $ne: this._id }
    });
    
    if (existing) {
      const err = new Error('Active request already exists between these users');
      err.name = 'ActiveRequestExists';
      return next(err);
    }
  }
  next();
});

const HireRequest = mongoose.model('HireRequest', hireRequestSchema);

// Safe index creation with error handling
async function ensureIndexes() {
  try {
    await HireRequest.collection.createIndex({ student: 1, tutor: 1 });
    await HireRequest.collection.createIndex({ status: 1 });
    console.log('HireRequest indexes verified');
  } catch (err) {
    console.error('Error creating HireRequest indexes:', err);
  }
}

// Run index check when model loads
ensureIndexes();

export default HireRequest;