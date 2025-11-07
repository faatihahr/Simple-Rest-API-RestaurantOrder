import { Router } from 'express';
import { transferPoints, getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { register, login } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth-middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/transfer-points', transferPoints);
router.get('/', getUsers);
router.post('/add', createUser);
router.put('/update/:id', authenticate, updateUser);
router.delete('/delete/:id', authenticate, deleteUser);

export default router;
