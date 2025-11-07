import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', requireRoles('admin', 'manager'), createCustomer);
router.patch('/:id', requireRoles('admin', 'manager'), updateCustomer);
router.delete('/:id', requireRoles('admin', 'manager'), deleteCustomer);

export default router;

