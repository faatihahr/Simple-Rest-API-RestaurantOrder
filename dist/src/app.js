import express from 'express';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.message.includes('Stock with id') && err.message.includes('not found')) {
        return res.status(404).json({ message: 'Stock not found', error: err.message });
    }
    if (err.message.includes('does not belong to supplier')) {
        return res.status(400).json({ message: 'Supplier mismatch', error: err.message });
    }
    if (err.message.includes('Insufficient stock')) {
        return res.status(400).json({ message: 'Insufficient stock', error: err.message });
    }
    if (err.message.includes('Invalid quantity change')) {
        return res.status(400).json({ message: 'Invalid quantity change', error: err.message });
    }
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map