import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { overview, salesTrend } from '../controllers/statsController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', asyncHandler(overview));
router.get(
  '/sales-trend',
  validateRequest({ range: { type: 'number' } }, 'query'),
  asyncHandler(salesTrend)
);

export default router;
