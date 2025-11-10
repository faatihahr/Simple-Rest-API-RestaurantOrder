import express from 'express';
import { registerSupplier, createStock, getSuppliers, getStocks, updateStock, deleteStock } from '../controllers/supplierController.js';
import { authorize } from '../middleware/auth-middleware.js';
import { supplierLogin } from '../controllers/authController.js';
const router = express.Router();
// Rute umum
router.post('/register', registerSupplier);
router.post('/login', supplierLogin);
// Rute yang bisa diakses admin sama user
router.get('/', getSuppliers);
router.get('/get/stocks', getStocks);
// Rute yang bisa diakses admin dan supplier
router.post('/add/stock', authorize(['admin', 'supplier']), createStock);
router.post('/stock', authorize(['admin', 'supplier']), updateStock);
router.delete('/delete', authorize(['admin', 'supplier']), deleteStock);
export default router;
//# sourceMappingURL=supplierRoutes.js.map