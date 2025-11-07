import express from 'express';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import { errorHandler } from './middleware/handlingerror-middleware.js';
import { authenticate } from './middleware/auth-middleware.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Public routes (no auth required)
app.use('/api/users', userRoutes); // Assuming login/signup are public
// Protected routes
app.use('/api/products', authenticate, productRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);
// Error handling middleware
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map