import express from 'express';
const router = express.Router();

import { signup, loginUser, getUserRole, getUserData, googleLogin, totalStudents } from '../controllers/studentUserController.js';
import { updateProfile, changePassword } from '../controllers/profleController.js'; // You may separate these for clarity
import { authUser } from '../middlewares/verifyToken.js';

// 🔐 Auth & Registration
router.post('/signup', signup);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

// 🧑‍💼 Authenticated User Info
router.get('/getUser', authUser, getUserData);

// ⚙️ Profile Management
router.put('/update-profile', authUser, updateProfile); // New controller to be added
router.put('/change-password', authUser, changePassword); // New controller to be added

// Get total students
router.get('/total-students', authUser, totalStudents);

router.get('/getUserRole', getUserRole);

export default router;
