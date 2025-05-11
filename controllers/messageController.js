import User from '../models/userModel.js';
import Message from '../models/Message.js';
import Conversation from '../models/conversation.js';
// import Hiring from '../models/hiring.js';

// ✅ Embedded canSendMessage logic
const canSendMessage = async (sender, receiver) => {
  const studentId = sender.role === 'student' ? sender._id : receiver._id;
  const tutorId = sender.role === 'tutor' ? sender._id : receiver._id;

  const conversation = await Conversation.findOne({ student: studentId, tutor: tutorId });
  const hiring = await Hiring.findOne({ student: studentId, tutor: tutorId });

  if (conversation || hiring) {
    return true;
  }

  if (sender.role === 'student') {
    await Conversation.create({
      student: sender._id,
      tutor: receiver._id,
      startedByStudent: true
    });
    return true;
  }

  return false;
};

// 📩 Send Message Controller
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowed = await canSendMessage(sender, receiver);
    if (!allowed) {
      return res.status(403).json({ error: 'Permission denied to send message' });
    }

    const message = await Message.create({ sender: senderId, receiver: receiverId, content });

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🤝 Hire Tutor Controller
export const hireTutor = async (req, res) => {
  try {
    const { studentId, tutorId } = req.body;

    const existing = await Hiring.findOne({ student: studentId, tutor: tutorId });
    if (!existing) {
      await Hiring.create({ student: studentId, tutor: tutorId });
    }

    const convo = await Conversation.findOne({ student: studentId, tutor: tutorId });
    if (!convo) {
      await Conversation.create({ student: studentId, tutor: tutorId, startedByStudent: false });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 💬 Get All Messages Between Two Users
export const getConversationMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📚 Get All Conversations for a User
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      $or: [{ student: userId }, { tutor: userId }]
    })
      .populate('student', 'firstName lastName username role image')
      .populate('tutor', 'firstName lastName username role image')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
