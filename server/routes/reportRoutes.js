import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { exportCSV, importCSV } from '../controllers/reportController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get(
  '/export',
  validateRequest(
    {
      type: { type: 'enum', required: true, values: ['customers', 'sales', 'profitloss'] },
      from: { type: 'date' },
      to: { type: 'date' }
    },
    'query'
  ),
  asyncHandler(exportCSV)
); // allow all roles to export
router.post(
  '/import',
  requireRoles('admin', 'manager'),
  validateRequest({ type: { type: 'enum', required: true, values: ['customers', 'sales'] } }, 'query'),
  validateRequest({ csv: { type: 'string', required: true, min: 1 } }, 'body'),
  asyncHandler(importCSV)
);

export default router;
