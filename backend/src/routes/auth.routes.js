import express from 'express';
import { signup, login, getProfile, verifyOTP, resendOTP } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

export default router;
