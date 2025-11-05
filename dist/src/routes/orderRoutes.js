import { Router } from 'express';
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrderSummary, } from '../controllers/orderController.js';
const router = Router();
router.get('/', getOrders);
router.get('/summary', getOrderSummary);
router.get('/:id', getOrderById);
router.post('/createorders', createOrder);
router.put('/update/:id', updateOrder);
router.delete('/del/:id', deleteOrder);
export default router;
//# sourceMappingURL=orderRoutes.js.map