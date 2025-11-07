import express from 'express';
import { registerSupplier, createStock, getSuppliers, getStocks, updateStock, deleteStock } from '../controllers/supplierController.js';
import { authorize } from '../middleware/auth-middleware.js';
import { supplierLogin } from '../controllers/authController.js';
const router = express.Router();
// Public routes
router.post('/register', registerSupplier);
router.post('/login', supplierLogin);
// Routes accessible by both admin and user
router.get('/', getSuppliers);
router.get('/get/stocks', getStocks);
// Routes accessible by admin and supplier
router.post('/add/stock', authorize(['admin', 'supplier']), createStock);
router.post('/stock', authorize(['admin', 'supplier']), updateStock);
router.delete('/delete', authorize(['admin', 'supplier']), deleteStock);
export default router;
//# sourceMappingURL=supplierRoutes.js.map