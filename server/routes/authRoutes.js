import { Router } from 'express';
import { login, me, logout } from '../controllers/authController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post(
  '/login',
  validateRequest({
    username: { type: 'string', required: true, min: 1 },
    password: { type: 'string', required: true, min: 1 },
    remember: { type: 'boolean' }
  }),
  asyncHandler(login)
);
router.post('/logout', asyncHandler(logout));
router.get('/me', optionalAuth, asyncHandler(me));

export default router;
