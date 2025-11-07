import { Router } from 'express';
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrderSummary, } from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth-middleware.js';
const router = Router();
// Routes accessible by both admin and user
router.get('/', getOrders);
router.get('/summary', getOrderSummary);
router.get('/:id(\\d+)', getOrderById);
router.post('/createorders', authenticate, createOrder); // Tambahkan authenticate untuk createOrder
router.put('/update/:id(\\d+)', updateOrder);
// Routes only accessible by admin
router.delete('/del/:id(\\d+)', authorize(['admin']), deleteOrder);
export default router;
//# sourceMappingURL=orderRoutes.js.map