import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listTransactions, createTransaction, deleteTransaction } from '../controllers/transactionController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/customers/:id/transactions',
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  validateRequest(
    {
      from: { type: 'date' },
      to: { type: 'date' },
      type: { type: 'enum', values: ['sale', 'receipt'] }
    },
    'query'
  ),
  asyncHandler(listTransactions)
);
router.post(
  '/customers/:id/transactions',
  requireRoles('admin', 'manager'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  validateRequest(
    {
      type: { type: 'enum', required: true, values: ['sale', 'receipt'] },
      amount: { type: 'number', required: true, min: 0 },
      // Accept any string; controller will coerce/guard
      date: { type: 'string' },
      description: { type: 'string' },
      billNumber: { type: 'string' },
      onBehalf: { type: 'string' }
    },
    'body'
  ),
  asyncHandler(createTransaction)
);
router.delete(
  '/transactions/:id',
  requireRoles('admin', 'manager'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  asyncHandler(deleteTransaction)
);

export default router;
