import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
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
  if (err.message === 'Email not registered' || err.message === 'Invalid password') {
    return res.status(401).json({ message: 'Invalid credentials', error: err.message });
  }
  if (err.message === 'Authentication required' ||
      err.message === 'You can only update your own data' ||
      err.message === 'You can only delete your own data') {
    return res.status(403).json({ message: 'Forbidden', error: err.message });
  }
  if (err.message === 'senderId, receiverId, and points are required' ||
      err.message === 'Points must be greater than 0' ||
      err.message === 'Sender and receiver cannot be the same' ||
      err.message === 'Not enough points!' ||
      err.message === 'name, email, and password are required' ||
      err.message === 'Email already exists' ||
      err.message === 'User ID is required' ||
      err.message === 'Invalid user ID' ||
      err.message === 'Email and password are required') {
    return res.status(400).json({ message: 'Bad request', error: err.message });
  }
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
};
