// routes/adminRoutes.js
import express from 'express';
import {
  getAllUsers,
  getUserDetails,
  deleteUser,
  getPendingTutors,
  processTutorRequest
} from '../controllers/adminController.js';
import  { authUser, isAdmin } from '../middlewares/verifyToken.js';

const router = express.Router();

// Admin routes
router.get('/users', authUser, isAdmin, getAllUsers);
router.get('/users/:id', authUser, isAdmin, getUserDetails);
router.delete('/users/:id', authUser, isAdmin, deleteUser);
router.get('/pending-tutors', authUser, isAdmin, getPendingTutors);
router.put('/tutor-requests/:id', authUser, isAdmin, processTutorRequest);

export default router;