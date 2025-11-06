import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
  if (err.message === 'Sender not found' || err.message === 'Receiver not found' || err.message === 'User not found') {
    return res.status(404).json({ message: 'User not found', error: err.message });
  }
  if (err.message === 'senderId, receiverId, and points are required' ||
      err.message === 'Points must be greater than 0' ||
      err.message === 'Sender and receiver cannot be the same' ||
      err.message === 'Not enough points!' ||
      err.message === 'name, email, and password are required' ||
      err.message === 'Email already exists' ||
      err.message === 'User ID is required' ||
      err.message === 'Invalid user ID') {
    return res.status(400).json({ message: 'Bad request', error: err.message });
  }
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
