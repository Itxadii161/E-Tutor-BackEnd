import express from 'express';
import { authUser } from '../middlewares/verifyToken.js';
import validateObjectId from '../middlewares/validateObjectId.js'
import { becomeTutor} from '../controllers/tutorController.js';
import { getTutors, getTutorById, rateTutor, hireTutor,} from '../controllers/tutorController.js';
const router = express.Router();

// Route: POST /becometutor (Authenticated, User can apply to be a tutor)
router.post('/becometutor', authUser, becomeTutor);

router.get('/', getTutors);
router.get('/:id', validateObjectId, getTutorById );// Add this middleware
  router.post('/rate', authUser, rateTutor);
router.post('/hire', authUser, hireTutor);
// router.get('/rating-check', authUser, checkUserRating);

export default router;
