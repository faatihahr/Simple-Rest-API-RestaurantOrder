import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderSummary,
} from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrders);
router.get('/summary', getOrderSummary);
router.get('/:id(\\d+)', getOrderById);
router.post('/createorders', createOrder);
router.put('/update/:id(\\d+)', updateOrder);
router.delete('/del/:id(\\d+)', deleteOrder);

export default router;
