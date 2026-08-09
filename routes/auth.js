import { Router } from 'express';
import { login, getMe, signup } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', authenticate, getMe);

export default router;
