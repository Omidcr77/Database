import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listUsers, createUser, patchUser, toggleBlock, deleteUser, changePassword } from '../controllers/userController.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin'), asyncHandler(listUsers));
router.post(
  '/',
  requireRoles('admin'),
  validateRequest(
    {
      username: { type: 'string', required: true, min: 3 },
      password: { type: 'string', required: true, min: 6 },
      name: { type: 'string' },
      phone: { type: 'string' },
      avatarUrl: { type: 'string' },
      role: { type: 'enum', values: ['admin', 'manager', 'viewer'] }
    },
    'body'
  ),
  asyncHandler(createUser)
);
router.patch(
  '/:id',
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  validateRequest(
    {
      username: { type: 'string', min: 3 },
      name: { type: 'string' },
      phone: { type: 'string' },
      avatarUrl: { type: 'string' },
      role: { type: 'enum', values: ['admin', 'manager', 'viewer'] },
      isBlocked: { type: 'boolean' }
    },
    'body'
  ),
  asyncHandler(patchUser)
); // Admin or self (controller restricts fields)
router.patch(
  '/:id/block',
  requireRoles('admin'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  asyncHandler(toggleBlock)
);
router.patch(
  '/:id/password',
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  validateRequest(
    {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string', required: true, min: 6 }
    },
    'body'
  ),
  asyncHandler(changePassword)
);
router.delete(
  '/:id',
  requireRoles('admin'),
  validateRequest({ id: { type: 'objectId', required: true } }, 'params'),
  asyncHandler(deleteUser)
);

export default router;
