import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword, updateStudioConfig } from './authController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.put('/update-profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.put('/update-studio-config', authenticate, updateStudioConfig);

export default router;
