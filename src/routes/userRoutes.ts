import { Router } from 'express';
import { transferPoints, getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.post('/transfer-points', transferPoints);
router.get('/', getUsers);
router.post('/add', createUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

export default router;
