import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../controllers/uploadController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.post(
  '/image',
  validateRequest({ data: { type: 'string', required: true, min: 20 } }, 'body'),
  asyncHandler(uploadImage)
);

export default router;
