import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Find or create a conversation
export const createOrGetConversation = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.body;

  try {
    let convo = await Conversation.findOne({
      members: { $all: [userId, otherUserId] }
    });

    if (!convo) {
      convo = await Conversation.create({ members: [userId, otherUserId] });
    }

    res.status(200).json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages in a conversation
// In your chatController.js
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id })
      .populate({
        path: 'sender',
        select: 'firstName lastName'
      });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  const { text, conversationId } = req.body;

  try {
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'firstName lastName'
      });

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// List all conversations of logged-in user
export const getUserConversations = async (req, res) => {
  try {
    const convos = await Conversation.find({ members: req.user._id })
      .populate({
        path: 'members',
        select: 'firstName lastName profilePicture isOnline',
        options: { lean: true } // Add this for better performance
      });

    // Enhance members data
    const enhancedConvos = convos.map(convo => ({
      ...convo.toObject(),
      members: convo.members.map(member => ({
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        isOnline: member.isOnline || false // Default to false if undefined
      }))
    }));

    res.status(200).json(enhancedConvos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// export default {
//   getMessages,
//   createOrGetConversation,
//   sendMessage,
//   getUserConversations
// }