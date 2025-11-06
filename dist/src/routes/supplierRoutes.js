import express from 'express';
import { updateStock } from '../controllers/supplierController.js';
const router = express.Router();
// POST /api/suppliers/stock
router.post('/stock', updateStock);
export default router;
//# sourceMappingURL=supplierRoutes.js.map