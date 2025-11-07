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

// Rute umum (ga perlu auth)
app.use('/api/users', userRoutes); // Asumsi login/signup umum

// Rute yang dilindungi
app.use('/api/products', authenticate, productRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);

// Middleware penanganan error
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
