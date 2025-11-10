import express from 'express';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import { errorHandler } from './middleware/handlingerror-middleware.js';
import { authenticate } from './middleware/auth-middleware.js';
import { uploadMiddleware } from './middleware/upload-middleware.js';
import { corsMiddleware } from './middleware/cors-middleware.js';
import { generalRateLimit } from './middleware/rate-limit-middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Cookie parser middleware
app.use(cookieParser());

// CORS middleware 
app.use(corsMiddleware);

// General rate limiting (applied to all routes)
app.use(generalRateLimit);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Serve static files from uploads directory with security headers
app.use('/src/uploads', express.static(path.join(process.cwd(), 'src', 'uploads'), {
  setHeaders: (res, path) => {
    // Security headers for uploaded files
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');

    // Only allow specific file types
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') ||
        path.endsWith('.gif') || path.endsWith('.webp')) {
      res.set('Content-Type', `image/${path.split('.').pop()}`);
    }
  },
  // mencegah listing direktori
  index: false,
  // mencegah akses ke dotfiles
  dotfiles: 'deny'
}));

// Rute umum 
app.use('/api/users', userRoutes); 

// Rute yang dilindungi
app.use('/api/products', authenticate, productRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);

// Middleware penanganan error
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
