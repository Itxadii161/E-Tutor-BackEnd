import mongoose from 'mongoose';

const hiringSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hiredAt: { type: Date, default: Date.now }
});

const Hiring = mongoose.model('Hiring', hiringSchema);
export default Hiring;
