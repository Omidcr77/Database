import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = Router();

router.use(requireAuth);
router.post('/image', uploadImage);

export default router;

