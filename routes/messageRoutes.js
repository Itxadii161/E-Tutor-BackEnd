import express from 'express';
import {
    sendMessage,
    hireTutor,
    getConversationMessages,
    getUserConversations
  } from '../controllers/messageController.js';
const router = express.Router();

router.post('/send', sendMessage);
router.post('/hire', hireTutor);
router.get('/messages/:userId1/:userId2', getConversationMessages);
router.get('/conversations/:userId', getUserConversations);

export default router;
