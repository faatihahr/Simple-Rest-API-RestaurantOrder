import express from 'express';
import { registerSupplier, createStock, getSuppliers, getStocks, updateStock, deleteStock } from '../controllers/supplierController.js';
import { authorize } from '../middleware/auth-middleware.js';
import { supplierLogin, logout } from '../controllers/authController.js';
import { uploadMiddleware } from '../middleware/upload-middleware.js';

const router = express.Router();

// Rute umum
router.post('/register', uploadMiddleware.fields([{ name: 'profileImage', maxCount: 1 }]), registerSupplier);
router.post('/login', supplierLogin);
router.post('/logout', logout);

// Rute yang bisa diakses admin sama user
router.get('/', getSuppliers);
router.get('/get/stocks', getStocks);

// Rute yang bisa diakses admin dan supplier
router.post('/add/stock', authorize(['admin', 'supplier']), uploadMiddleware.single('stockImage'), createStock);
router.post('/stock', authorize(['admin', 'supplier']), updateStock);
router.delete('/delete', authorize(['admin', 'supplier']), deleteStock);

export default router;
