import express from 'express';
import { createSupplier, createStock, getSuppliers, getStocks, updateStock, deleteStock } from '../controllers/supplierController.js';

const router = express.Router();

// Batch update stocks
router.post('/stock', updateStock);

// Batch delete stocks
router.delete('/delete', deleteStock);

// create a new supplier
router.post('/create', createSupplier);

// show all suppliers
router.get('/', getSuppliers);

// create a new stock item
router.post('/create/stocks', createStock);

// get all stocks, with optional supplierId filter and limit
router.get('/get/stocks', getStocks);

export default router;
