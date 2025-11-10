import { Router } from 'express';
import { transferPoints, getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { register, login, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authRateLimit, uploadRateLimit } from '../middleware/rate-limit-middleware.js';
import { uploadMiddleware } from '../middleware/upload-middleware.js';

const router = Router();

// Terapkan batasan rate yang lebih ketat untuk endpoint auth
router.post('/register', authRateLimit, uploadMiddleware.single('profileImage'), register);
router.post('/login', authRateLimit, login);
router.post('/logout', logout);

router.post('/transfer-points', transferPoints);
router.get('/', getUsers);
router.post('/add', createUser);
router.put('/update/:id', authenticate, uploadRateLimit, updateUser);
router.delete('/delete/:id', authenticate, deleteUser);

export default router;
