import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { exportCSV, importCSV } from '../controllers/reportController.js';

const router = Router();

router.use(requireAuth);
router.get('/export', exportCSV); // allow all roles to export
router.post('/import', requireRoles('admin', 'manager'), importCSV);

export default router;

