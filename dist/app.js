import * as express from 'express';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map