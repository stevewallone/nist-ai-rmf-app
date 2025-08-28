import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/security.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimit, login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;