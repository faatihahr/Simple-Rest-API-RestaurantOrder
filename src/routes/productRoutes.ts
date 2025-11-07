import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from '../controllers/productController.js';
import { authorize } from '../middleware/auth-middleware.js';

const router = Router();

// Rute yang bisa diakses admin sama user
router.get('/', getProducts);
router.get('/category/:categoryName', getProductsByCategory);
router.get('/:id', getProductById);

// Rute cuma bisa diakses admin
router.post('/createprd', authorize(['admin']), createProduct);
router.put('/update/:id', authorize(['admin']), updateProduct);
router.delete('/:id', authorize(['admin']), deleteProduct);

export default router;
