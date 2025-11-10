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
import { uploadRateLimit, productRateLimit } from '../middleware/rate-limit-middleware.js';
import { uploadMiddleware } from '../middleware/upload-middleware.js';

const router = Router();

// Rute yang bisa diakses admin sama user
router.get('/', getProducts);
router.get('/category/:categoryName', getProductsByCategory);
router.get('/:id', getProductById);

// Rute cuma bisa diakses admin with rate limiting
router.post('/createprd', uploadRateLimit, authorize(['admin']), uploadMiddleware.single('productImage'), createProduct);
router.put('/update/:id', productRateLimit, authorize(['admin']), uploadMiddleware.single('productImage'), updateProduct);
router.delete('/:id', productRateLimit, authorize(['admin']), deleteProduct);

export default router;
