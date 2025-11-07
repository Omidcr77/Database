import { Router } from 'express';
import { login, me, logout } from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', optionalAuth, me);

export default router;

