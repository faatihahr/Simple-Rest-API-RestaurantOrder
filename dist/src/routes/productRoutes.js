import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductsByCategory, } from '../controllers/productController.js';
const router = Router();
router.get('/', getProducts);
router.get('/category/:categoryName', getProductsByCategory);
router.get('/:id', getProductById);
router.post('/createprd', createProduct);
router.put('/update/:id', updateProduct);
router.delete('/:id', deleteProduct);
export default router;
//# sourceMappingURL=productRoutes.js.map