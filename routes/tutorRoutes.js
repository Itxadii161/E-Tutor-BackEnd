import express from 'express';
import { authUser } from '../middlewares/verifyToken.js';
const router = express.Router();
import { becomeTutor } from '../controllers/tutorController.js';

// Route: POST /becometutor
router.post('/becometutor', authUser, becomeTutor);

export default router;
