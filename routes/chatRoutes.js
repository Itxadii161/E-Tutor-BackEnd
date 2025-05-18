import express from 'express';
const router = express.Router();
import { getMessages,
    createOrGetConversation,
    sendMessage,
    getUserConversations } from '../controllers/chatController.js';
import {authUser} from '../middlewares/verifyToken.js';

router.post('/conversation', authUser, createOrGetConversation);
router.get('/conversations', authUser, getUserConversations);
router.get('/messages/:id', authUser, getMessages);
router.post('/messages', authUser, sendMessage);

export default  router;
