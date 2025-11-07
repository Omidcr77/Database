import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { listUsers, createUser, patchUser, toggleBlock, deleteUser, changePassword } from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin'), listUsers);
router.post('/', requireRoles('admin'), createUser);
router.patch('/:id', requireAuth, patchUser); // Admin or self (controller restricts fields)
router.patch('/:id/block', requireRoles('admin'), toggleBlock);
router.patch('/:id/password', requireAuth, changePassword);
router.delete('/:id', requireRoles('admin'), deleteUser);

export default router;

