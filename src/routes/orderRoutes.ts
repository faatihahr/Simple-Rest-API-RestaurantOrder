import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/createorders', createOrder);
router.put('/update/:id', updateOrder);
router.delete('/del/:id', deleteOrder);

export default router;
