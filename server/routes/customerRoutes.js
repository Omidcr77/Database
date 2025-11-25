import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validateRequest(
    {
      search: { type: 'string' },
      category: { type: 'enum', values: ['', 'Customer', 'Investor', 'Employee', 'Other'] },
      page: { type: 'number', min: 1 },
      limit: { type: 'number', min: 1 }
    },
    'query'
  ),
  asyncHandler(listCustomers)
);
router.get('/:id', validateRequest({ id: { type: 'objectId', required: true } }, 'params'), asyncHandler(getCustomer));
router.post(
  '/',
  requireRoles('admin', 'manager'),
  validateRequest(
    {
      firstName: { type: 'string', required: true, min: 1 },
      lastName: { type: 'string', required: true, min: 1 },
      phone: { type: 'string' },
      address: { type: 'string' },
      photoUrl: { type: 'string' },
      category: { type: 'enum', values: ['Customer', 'Investor', 'Employee', 'Other'] },
      openingBalance: { type: 'number', min: 0 },
      openingDirection: { type: 'enum', values: ['they_owe', 'we_owe'] },
      openingDate: { type: 'date' },
      idNumber: { type: 'string' },
      note: { type: 'string' }
    },
    'body'
  ),
  asyncHandler(createCustomer)
);
router.patch(
  '/:id',
  requireRoles('admin', 'manager'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  validateRequest(
    {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      phone: { type: 'string' },
      address: { type: 'string' },
      photoUrl: { type: 'string' },
      category: { type: 'enum', values: ['Customer', 'Investor', 'Employee', 'Other'] },
      idNumber: { type: 'string' },
      note: { type: 'string' }
    },
    'body'
  ),
  asyncHandler(updateCustomer)
);
router.delete(
  '/:id',
  requireRoles('admin', 'manager'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  asyncHandler(deleteCustomer)
);

export default router;
