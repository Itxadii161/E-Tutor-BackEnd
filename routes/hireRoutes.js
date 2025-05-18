import express from 'express';
import { 
  sendHireRequest, 
  checkHireStatus, 
  cancelHireRequest,
  acceptHireRequest,
  rejectHireRequest,
  getUserNotifications,
  getTutorHireRequests
} from '../controllers/hireController.js';
import { authUser } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/request', authUser, sendHireRequest);
router.get('/status/:tutorId', authUser, checkHireStatus);
router.post('/cancel', authUser, cancelHireRequest);
router.post('/accept', authUser, acceptHireRequest);
router.post('/reject', authUser, rejectHireRequest);
router.get('/notifications', authUser, getUserNotifications); // New endpoint
router.get('/requests', authUser, getTutorHireRequests); // Optional: all pending requests
export default router;