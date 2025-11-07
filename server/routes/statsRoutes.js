import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { overview, salesTrend } from '../controllers/statsController.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', overview);
router.get('/sales-trend', salesTrend);

export default router;

