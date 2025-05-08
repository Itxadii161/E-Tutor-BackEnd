import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedByStudent: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
