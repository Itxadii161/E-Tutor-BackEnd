// routes/studentUserRoutes.js
import express from 'express';
const router = express.Router();
import fs from 'fs';
import upload from '../middlewares/upload.js';
import { signup, loginUser, getUserRole, getUserData, googleLogin, totalStudents } from '../controllers/studentUserController.js';
import { updateProfile, changePassword } from '../controllers/profileController.js';
import { authUser } from '../middlewares/verifyToken.js';

// 🔐 Auth & Registration
router.post('/signup', signup);
router.post('/google-login', googleLogin);
router.post('/login', loginUser);

// 🧑‍💼 Authenticated User Info
router.get('/getUser', authUser, getUserData);

// ⚙️ Profile Info Update (Text Only: name, email, bio)
router.put('/update-profile', authUser, upload.single('image'), updateProfile);

// 🖼️ Profile Image Update (Separate Route)
// 🔐 Password Management
router.put('/change-password', authUser, changePassword);

// 📊 Others
router.get('/total-students', authUser, totalStudents);
router.get('/getUserRole', getUserRole);

export default router;
