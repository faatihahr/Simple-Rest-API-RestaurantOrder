import { Router } from 'express';
import { transferPoints, getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { register, login } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth-middleware.js';
import { authRateLimit, uploadRateLimit } from '../middleware/rate-limit-middleware.js';
const router = Router();
// Apply stricter rate limiting to auth endpoints
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/transfer-points', transferPoints);
router.get('/', getUsers);
router.post('/add', createUser);
router.put('/update/:id', authenticate, uploadRateLimit, updateUser);
router.delete('/delete/:id', authenticate, deleteUser);
export default router;
//# sourceMappingURL=userRoutes.js.map