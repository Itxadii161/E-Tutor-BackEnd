import express from 'express';
import { upload, uploadSingleToCloudinary } from '../middlewares/uploadMiddleware.js';
import { authUser } from '../middlewares/verifyToken.js';
import { becomeTutor} from '../controllers/tutorController.js';
import { getTutors, getTutorById, rateTutor,} from '../controllers/tutorController.js';
const router = express.Router();

const uploadFields = upload.fields([
  { name: 'resumeUrl', maxCount: 1 },
  { name: 'idProofUrl', maxCount: 1 },
  { name: 'educationCertificates', maxCount: 10 },
]);

router.post(
  '/become-tutor',
  authUser,
  uploadFields,
  uploadSingleToCloudinary('resumeUrl'),
  uploadSingleToCloudinary('idProofUrl'),
  uploadSingleToCloudinary('educationCertificates'),
  becomeTutor
);
// Route: POST /becometutor (Authenticated, User can apply to be a tutor)
// router.post('/becometutor', authUser,uploadTutorFiles, becomeTutor);
router.get('/', getTutors);
router.get('/:id', authUser, getTutorById );// Add this middleware
  router.post('/rate', authUser, rateTutor);

export default router;
