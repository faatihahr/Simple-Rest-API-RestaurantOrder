import express from 'express';
import path from 'path';
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
// CORS middleware (must be first)
app.use(corsMiddleware);
// General rate limiting (applied to all routes)
app.use(generalRateLimit);
app.use(express.json());
app.use(uploadMiddleware);
// Serve static files from uploads directory with security headers
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
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
    // Prevent directory listing
    index: false,
    // Prevent access to hidden files
    dotfiles: 'deny'
}));
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
//# sourceMappingURL=app.js.map