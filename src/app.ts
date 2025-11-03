import express from 'express';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
