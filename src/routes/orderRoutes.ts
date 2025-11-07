import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderSummary,
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth-middleware.js';

const router = Router();

// Rute yang bisa diakses admin sama user
router.get('/', getOrders);
router.get('/summary', getOrderSummary);
router.get('/:id(\\d+)', getOrderById);
router.post('/createorders', authenticate, createOrder); 
router.put('/update/:id(\\d+)', updateOrder);

// Rute cuma bisa diakses admin
router.delete('/del/:id(\\d+)', authorize(['admin']), deleteOrder);

export default router;
