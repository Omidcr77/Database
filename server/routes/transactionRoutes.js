import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listTransactions, createTransaction, deleteTransaction } from '../controllers/transactionController.js';

const router = Router();

router.use(requireAuth);

router.get('/customers/:id/transactions', listTransactions);
router.post('/customers/:id/transactions', requireRoles('admin', 'manager'), createTransaction);
router.delete('/transactions/:id', requireRoles('admin', 'manager'), deleteTransaction);

export default router;

