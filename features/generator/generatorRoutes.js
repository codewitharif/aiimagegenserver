import { Router } from 'express';
import { generateImage, getImages } from './generatorController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/generate', authenticate, generateImage);
router.get('/images', authenticate, getImages);

export default router;
